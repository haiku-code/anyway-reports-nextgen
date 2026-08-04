# Firebase Staging Environment - Design

Date: 2026-08-04
Status: Approved

## Problem

The project has a single deployed environment: production on Netlify
(`anyway-reports.netlify.app`), built from `main`. There is nowhere to put a
change in front of a stakeholder before it is live to the public.

We need a staging environment on Firebase Hosting.

## Context

- Static Vite + React SPA. No backend of its own; data comes from the external
  `anyway.co.il` API. Nothing server-side to stage.
- No client-side router. Netlify serves `dist/` with no redirect rules, so
  unknown paths 404.
- Single branch (`main`), no CI.
- `index.html` hardcodes four third-party tracking tags in one contiguous block
  (currently lines 78-154):
  - Chartbeat (`uid 20691`, `domain: ynet.co.il`)
  - Meta/Facebook Pixel (`2856803197837755`)
  - Google Analytics `G-70V76NNE0T` (Natoon Leshinuy)
  - Google Analytics `G-B0H8ZSFBCE` (ynet)
- `index.html` also loads the equally.ai accessibility widget. This is a product
  feature, not tracking, and stays in every build.
- Firebase CLI 15.6.0 is installed locally.

## Decisions

| Question | Decision |
| --- | --- |
| Does production move to Firebase? | No. Netlify remains production. Firebase is staging only. |
| Deploy trigger | Manual, via an npm script. No CI, no branch automation, no PR previews. |
| Firebase project | `anyway-reports-staging`, created 2026-08-04 via `firebase projects:create`. Default Hosting site is provisioned. |
| Tracking tags on staging | Stripped at build time. |
| Search engine indexing | `noindex` meta tag. |

### Why tracking is stripped

Staging traffic hitting the live GA properties and Pixel would pollute a
client's (ynet's) analytics with developer activity. There is no way to filter
it out after the fact.

Rejected alternative: pointing staging at separate GA/Pixel IDs. It requires
creating and maintaining duplicate analytics properties for data nobody will
read.

### Why `noindex` and not `robots.txt`

A `robots.txt` `Disallow` blocks crawling, which means Google cannot read a
`noindex` directive on the page and may still index the URL based on inbound
links. `noindex` is the correct primary tool, and using both together defeats
it. Staging gets `noindex, nofollow` and no `robots.txt` change.

### Why a Vite mode and not a post-build script

Rejected: a Node script that rewrites `dist/index.html` after the build. It is
string surgery on generated output and fails silently the first time the emitted
HTML shifts.

Rejected: a second `index.staging.html`. Two copies of a 150-line file that
drift apart.

Chosen: Vite's `transformIndexHtml` hook operating on the source file, driven by
build mode. The transform is declarative and lives next to the config it
belongs to.

## Design

### 1. Firebase configuration

Two committed files at the repo root.

`.firebaserc` maps the alias `staging` to the new Firebase project ID:

```json
{
  "projects": {
    "staging": "anyway-reports-staging"
  }
}
```

`firebase.json` configures hosting:

- `public: "dist"`
- `ignore`: `firebase.json`, dotfiles, `node_modules/**`
- `headers`: long-lived immutable `Cache-Control` on `/assets/**`, which Vite
  content-hashes
- **No `rewrites`.** The app has no router and Netlify does not rewrite, so
  adding an SPA catch-all would make staging behave differently from
  production.

The staging URL is Firebase's default site URL for the project,
`https://anyway-reports-staging.web.app`.

### 2. Tracking strip and `noindex` injection

In `index.html`, the existing contiguous tracking block is wrapped in marker
comments. No tag content changes:

```html
<!-- tracking:start -->
... chartbeat, Meta Pixel, GA x2, unchanged ...
<!-- tracking:end -->
```

An inline plugin in `vite.config.ts` implements `transformIndexHtml`. When
`mode !== 'production'` it:

1. removes everything between `<!-- tracking:start -->` and
   `<!-- tracking:end -->`, inclusive
2. injects `<meta name="robots" content="noindex, nofollow" />` into `<head>`

When `mode === 'production'` the HTML passes through untouched.

Side effect, considered desirable: `npm run dev` also stops firing ynet's tags,
since dev mode is not `production`.

### 3. Build modes

`vite build` defaults to mode `production`, so the existing `npm run build`,
which is what Netlify runs, keeps its command and its behaviour. The only
difference in its output is the two inert marker comments now present in
`index.html`. Staging adds `--mode staging`.

No `.env` files. The build mode is the only signal the transform needs.

### 4. npm scripts

```json
"build:staging": "tsc -b && vite build --mode staging",
"deploy:staging": "npm run build:staging && firebase deploy --only hosting -P staging"
```

`npm run deploy:staging` can be run from any branch, with any working tree
state. One-time prerequisite for the operator: `firebase login`.

### 5. Files touched

| File | Change |
| --- | --- |
| `.firebaserc` | new |
| `firebase.json` | new |
| `vite.config.ts` | add inline `transformIndexHtml` plugin |
| `index.html` | add two marker comments |
| `package.json` | add two scripts |
| `.gitignore` | add `.firebase/` (CLI deploy cache) |

Explicitly untouched: `netlify.toml`, the `build` script, everything in `src/`.

## Verification

Automated checks after implementation:

1. `npm run build` (production path), then assert the emitted
   `dist/index.html` contains all four of `chartbeat`, `fbq`,
   `G-70V76NNE0T`, `G-B0H8ZSFBCE`, and does **not** contain `noindex`.
2. `npm run build:staging`, then assert the emitted `dist/index.html`
   contains **zero** occurrences of `chartbeat`, `fbq`, `gtag`, and **does**
   contain `noindex, nofollow`.
3. Assert the equally.ai widget script is present in both builds.
4. After the first deploy, fetch `https://anyway-reports-staging.web.app` and run
   assertion 2 against the served HTML.

## Out of scope

- Migrating production off Netlify.
- CI, branch-triggered deploys, and per-PR preview channels.
- Access control on the staging URL. It will be publicly reachable to anyone
  with the link, and unindexed.
- Staging-specific API endpoints. The app reads production `anyway.co.il` data
  in every environment.
