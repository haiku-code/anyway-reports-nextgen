# Firebase Staging Environment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a manually-deployed staging site on Firebase Hosting at
`https://anyway-reports-staging.web.app`, serving a build with all third-party
tracking removed and `noindex` set, while production on Netlify is unaffected.

**Architecture:** A Vite build mode (`staging`) drives an inline
`transformIndexHtml` plugin that deletes a marked block of tracking tags from
`index.html` and injects a `robots` meta tag. Firebase Hosting config is
committed at the repo root and deployed by an npm script. `vite build` defaults
to mode `production`, so Netlify's existing `npm run build` keeps emitting the
tracking tags with no change to its command.

**Tech Stack:** Vite 7, React 19, TypeScript 5.8, Firebase CLI 15.6, Firebase
Hosting.

**Spec:** `docs/superpowers/specs/2026-08-04-firebase-staging-design.md`

## Global Constraints

- Never use em dashes (`—`) or en dashes (`–`) in any file, comment, or commit
  message. Use a plain hyphen `-` with surrounding spaces.
- Do not modify `netlify.toml`, the `build` npm script, or anything under
  `src/`.
- Do not add an SPA `rewrites` rule to `firebase.json`. The app has no router
  and Netlify does not rewrite; staging must 404 on unknown paths exactly as
  production does.
- Do not add a `robots.txt` `Disallow`. It would block crawlers from reading
  the `noindex` meta tag. The meta tag is the only indexing control.
- Do not remove or alter the equally.ai accessibility widget
  (`index.html` lines 48-76). It is a product feature and must survive in
  every build, including staging.
- Firebase project ID is `anyway-reports-staging`, aliased as `staging`. It
  already exists and its default Hosting site is provisioned.
- No new npm dependencies. The HTML transform is an inline plugin, not a
  package.

---

### Task 1: Strip tracking tags and add `noindex` outside production builds

**Files:**
- Modify: `index.html` (insert marker comments around lines 78-154)
- Modify: `vite.config.ts` (whole file rewritten)
- Test: none. This repo has no test runner and the spec puts adding one out of
  scope. Verification is a grep assertion against build output, spelled out in
  Steps 2, 5, and 6.

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `npm run build` continues to emit tracking tags. A build run with
  `vite build --mode staging` emits HTML with the tracking block removed and
  `<meta name="robots" content="noindex, nofollow" />` present in `<head>`.
  Task 2 relies on the `--mode staging` flag existing as the trigger.

- [ ] **Step 1: Add marker comments to `index.html`**

The tracking block is contiguous. It starts at the `<script>` that opens the
Chartbeat IIFE (the line directly after the closing `</script>` of the
equally.ai widget) and ends at the `</script>` closing the ynet GA tag, which
is the last element before `</body>`.

Insert `<!-- tracking:start -->` on its own line immediately **before** this
line:

```html
    <script>
      // chartbeat
```

Insert `<!-- tracking:end -->` on its own line immediately **after** the final
`</script>` of the ynet GA block, i.e. after:

```html
      gtag('config', 'G-B0H8ZSFBCE')
    </script>
```

Change nothing else. Do not reindent, reorder, or edit any tag content. The
result must look like this, with the elided middle left byte-for-byte as it is
today:

```html
    <!-- tracking:start -->
    <script>
      // chartbeat
      ...
    </script>

    <!-- Meta Pixel Code -->
    ...
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-B0H8ZSFBCE"></script>
    <script>
      window.dataLayer = window.dataLayer || []
      function gtag() {
        dataLayer.push(arguments)
      }
      gtag('js', new Date())

      gtag('config', 'G-B0H8ZSFBCE')
    </script>
    <!-- tracking:end -->
  </body>
```

- [ ] **Step 2: Verify the markers wrap exactly the intended block**

Run:

```bash
sed -n '/<!-- tracking:start -->/,/<!-- tracking:end -->/p' index.html \
  | grep -c -e 'chartbeat.com' -e 'fbevents.js' -e 'G-70V76NNE0T' -e 'G-B0H8ZSFBCE'
```

Expected: `4`

Then confirm the accessibility widget is **outside** the markers:

```bash
sed -n '/<!-- tracking:start -->/,/<!-- tracking:end -->/p' index.html \
  | grep -c 'equally-widget.min.js'
```

Expected: `0`

If either number differs, the markers are in the wrong place. Fix before
continuing.

- [ ] **Step 3: Rewrite `vite.config.ts` with the transform plugin**

Replace the entire contents of `vite.config.ts` with:

```ts
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const TRACKING_BLOCK = /[ \t]*<!-- tracking:start -->[\s\S]*?<!-- tracking:end -->\n?/g
const NOINDEX = '    <meta name="robots" content="noindex, nofollow" />\n  </head>'

// The tracking tags in index.html report to ynet's live Chartbeat, Meta Pixel
// and GA properties. Only a production build may fire them, so staging and dev
// builds get the block removed and are marked noindex.
function stripTrackingOutsideProduction(mode: string): Plugin {
  return {
    name: 'strip-tracking-outside-production',
    transformIndexHtml(html) {
      if (mode === 'production') return html
      return html.replace(TRACKING_BLOCK, '').replace('</head>', NOINDEX)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), stripTrackingOutsideProduction(mode)],
}))
```

Note the config export changed from an object to a function so it can read
`mode`. The `plugins` array keeps `react()` and `tailwindcss()` in their
existing order.

- [ ] **Step 4: Add the `build:staging` script**

In `package.json`, add one line to `scripts`, directly after the existing
`"build"` entry:

```json
"build:staging": "tsc -b && vite build --mode staging",
```

- [ ] **Step 5: Verify the production build is unaffected**

Run:

```bash
npm run build
for t in chartbeat.com fbevents.js G-70V76NNE0T G-B0H8ZSFBCE equally-widget.min.js; do
  printf '%s: %s\n' "$t" "$(grep -c "$t" dist/index.html)"
done
printf 'noindex: %s\n' "$(grep -c noindex dist/index.html)"
```

Expected: every tracking token reports `1` or more, `equally-widget.min.js`
reports `1` or more, and `noindex` reports `0`.

If any tracking token reports `0`, the plugin is stripping in production. Stop
and fix.

- [ ] **Step 6: Verify the staging build strips tracking and adds `noindex`**

Run:

```bash
npm run build:staging
for t in chartbeat.com fbevents.js googletagmanager G-70V76NNE0T G-B0H8ZSFBCE; do
  printf '%s: %s\n' "$t" "$(grep -c "$t" dist/index.html)"
done
printf 'equally-widget.min.js: %s\n' "$(grep -c equally-widget.min.js dist/index.html)"
grep -o '<meta name="robots"[^>]*>' dist/index.html
```

Expected: every tracking token reports `0`, `equally-widget.min.js` reports `1`
or more, and the final command prints
`<meta name="robots" content="noindex, nofollow" />`.

- [ ] **Step 7: Verify lint still passes**

Run: `npm run lint`
Expected: exit 0, no output. `vite.config.ts` is newly typed with `Plugin`, so
this catches an unused or wrong import.

- [ ] **Step 8: Commit**

```bash
git add index.html vite.config.ts package.json
git commit -m "feat: strip tracking tags and noindex non-production builds

Chartbeat, Meta Pixel and both GA tags now only ship in the production
build. Staging and dev builds drop them and set robots noindex, so
developer traffic never reaches ynet's analytics."
```

---

### Task 2: Firebase Hosting config and staging deploy

**Files:**
- Create: `firebase.json`
- Create: `.firebaserc`
- Modify: `.gitignore` (append one entry)
- Modify: `package.json` (add `deploy:staging` script)
- Test: none. Verification is an HTTP fetch of the deployed site, in Step 6.

**Interfaces:**
- Consumes: the `build:staging` script from Task 1, which produces a stripped
  `dist/`.
- Produces: `npm run deploy:staging`, which builds and deploys to
  `https://anyway-reports-staging.web.app`.

- [ ] **Step 1: Create `firebase.json`**

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "headers": [
      {
        "source": "/assets/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  }
}
```

There is deliberately no `rewrites` key. See Global Constraints.

- [ ] **Step 2: Create `.firebaserc`**

```json
{
  "projects": {
    "staging": "anyway-reports-staging"
  }
}
```

- [ ] **Step 3: Ignore the Firebase CLI cache directory**

Append to `.gitignore`, after the existing `dist-ssr` / `*.local` block:

```
# Firebase CLI deploy cache
.firebase/
```

- [ ] **Step 4: Add the `deploy:staging` script**

In `package.json`, add to `scripts` directly after `build:staging`:

```json
"deploy:staging": "npm run build:staging && firebase deploy --only hosting -P staging",
```

- [ ] **Step 5: Deploy**

Run: `npm run deploy:staging`

Expected: the CLI prints `Deploy complete!` and a Hosting URL of
`https://anyway-reports-staging.web.app`.

If it fails with an auth error, run `firebase login` and retry. If it fails
with "site not found", run
`firebase hosting:sites:list -P staging` to confirm the site ID matches the
project ID.

- [ ] **Step 6: Verify the live site**

Run:

```bash
curl -s -o /dev/null -w 'status: %{http_code}\n' https://anyway-reports-staging.web.app
curl -s https://anyway-reports-staging.web.app > /tmp/staging.html
for t in chartbeat.com fbevents.js googletagmanager G-70V76NNE0T G-B0H8ZSFBCE; do
  printf '%s: %s\n' "$t" "$(grep -c "$t" /tmp/staging.html)"
done
printf 'equally-widget.min.js: %s\n' "$(grep -c equally-widget.min.js /tmp/staging.html)"
grep -o '<meta name="robots"[^>]*>' /tmp/staging.html
```

Expected: status `200`, every tracking token `0`, `equally-widget.min.js` `1`
or more, and the robots meta tag printed.

Then confirm unknown paths 404 rather than serving the app, matching Netlify:

```bash
curl -s -o /dev/null -w 'status: %{http_code}\n' https://anyway-reports-staging.web.app/no-such-path
```

Expected: status `404`.

- [ ] **Step 7: Confirm production is untouched**

Run:

```bash
git status --short
git diff HEAD~2 --stat -- netlify.toml src/
```

Expected: `git status` shows only the intended new and modified files, and the
`git diff` produces no output, proving `netlify.toml` and `src/` were not
changed.

- [ ] **Step 8: Commit**

```bash
git add firebase.json .firebaserc .gitignore package.json
git commit -m "feat: add firebase hosting staging deploy

npm run deploy:staging builds with tracking stripped and deploys to
anyway-reports-staging.web.app. Netlify remains production and its
build command is unchanged."
```

---

### Task 3: Document the environments in the README

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: the `deploy:staging` script from Task 2.
- Produces: nothing later tasks depend on.

`README.md` is currently the untouched Vite template boilerplate and says
nothing about how this project deploys. Someone finding `deploy:staging` in
`package.json` has no way to learn what it targets or that production lives
elsewhere.

- [ ] **Step 1: Add an Environments section**

Insert this immediately after the first paragraph of `README.md`, before the
`## Expanding the ESLint configuration` heading:

```markdown
## Environments

| Environment | Host | URL | Deployed by |
| --- | --- | --- | --- |
| Production | Netlify | https://anyway-reports.netlify.app | Netlify builds `main` with `npm run build` |
| Staging | Firebase Hosting | https://anyway-reports-staging.web.app | `npm run deploy:staging`, manually, from any branch |

Staging builds strip the third-party tracking tags (Chartbeat, Meta Pixel and
both Google Analytics properties) and set `robots: noindex, nofollow`, so
developer traffic never reaches ynet's analytics and the staging URL is never
indexed. The same stripping applies to `npm run dev`. Only `npm run build`,
which Netlify runs, ships the tags.

Design notes: `docs/superpowers/specs/2026-08-04-firebase-staging-design.md`
```

- [ ] **Step 2: Verify formatting**

Run: `npx prettier --check README.md`
Expected: `All matched files use Prettier code style!`

If it fails, run `npx prettier --write README.md`.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document production and staging environments"
```

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
| --- | --- |
| `.firebaserc` with `staging` alias | 2.2 |
| `firebase.json`, public `dist`, ignore list, asset cache headers | 2.1 |
| No SPA rewrite | 2.1, verified 2.6 |
| Marker comments in `index.html` | 1.1, verified 1.2 |
| `transformIndexHtml` plugin stripping tracking | 1.3, verified 1.6 |
| `noindex, nofollow` injection | 1.3, verified 1.6 |
| Production build unchanged | 1.5, 2.7 |
| `build:staging` script | 1.4 |
| `deploy:staging` script | 2.4 |
| `.gitignore` gets `.firebase/` | 2.3 |
| equally.ai widget survives both builds | verified 1.5, 1.6, 2.6 |
| Verification against the live URL | 2.6 |

No gaps.

**Placeholder scan:** No TBDs, no "handle errors appropriately", no "similar to
Task N". Every code step carries literal content.

**Type consistency:** One symbol crosses task boundaries, the npm script name
`build:staging`, defined in Task 1 Step 4 and consumed in Task 2 Step 4.
`stripTrackingOutsideProduction` and the `TRACKING_BLOCK` / `NOINDEX` constants
are local to `vite.config.ts` and referenced nowhere else. The marker strings
`<!-- tracking:start -->` and `<!-- tracking:end -->` appear in Task 1 Step 1
and in the `TRACKING_BLOCK` regex in Step 3, and match exactly.
