# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page Hebrew (RTL) data-journalism report on road-accident risk around
Israeli educational institutions, published with ynet and Natoon Leshinuy. It is
a static Vite build with no backend of its own.

## Commands

| Command               | What it does                                                          |
| --------------------- | --------------------------------------------------------------------- |
| `npm run dev`         | Vite dev server                                                       |
| `npm run build`       | Production build (`tsc -b && vite build`). This is what Netlify runs. |
| `npm run build:stg`   | Staging build (`--mode staging`), tracking tags stripped              |
| `npm run deploy:stg`  | Build staging and deploy to Firebase Hosting                          |
| `npm run deploy:prod` | Build production and deploy to Netlify                                |
| `npm run lint`        | ESLint, `--max-warnings=0`                                            |
| `npm run format`      | Prettier over the repo                                                |

There is no test framework and no `test` script. Verification here means
building and asserting on `dist/` output, or checking the deployed URL.

`npm run lint` currently fails on two pre-existing `react/no-unescaped-entities`
errors in `src/components/Hero.tsx`. Do not treat that as a regression you
caused, and do not "fix" it as a drive-by unless asked.

## Deployment

| Environment | Host                                                | URL                                    | Command               |
| ----------- | --------------------------------------------------- | -------------------------------------- | --------------------- |
| Production  | Netlify                                             | https://anyway-reports.netlify.app     | `npm run deploy:prod` |
| Staging     | Firebase Hosting (project `anyway-reports-staging`) | https://anyway-reports-staging.web.app | `npm run deploy:stg`  |

Both deploys are manual and run from any branch. Netlify additionally builds
`main` automatically through its Git integration, so pushing to `main` also
ships production. Treat `npm run deploy:prod` and pushing to `main` as equally
public actions and confirm before doing either.

Per-machine one-time setup: `npx firebase login` for staging,
`npx netlify login && npx netlify link` for production.

### Tracking tags are build-mode dependent

`index.html` carries four third-party tracking tags belonging to the publishing
partners: Chartbeat (`uid 20691`, `ynet.co.il`), the Meta Pixel, and two Google
Analytics properties (`G-70V76NNE0T` Natoon Leshinuy, `G-B0H8ZSFBCE` ynet).
They sit in one contiguous block fenced by `<!-- tracking:start -->` and
`<!-- tracking:end -->`.

`vite.config.ts` holds an inline `transformIndexHtml` plugin,
`stripTrackingOutsideProduction`. For any build whose mode is not `production`
it deletes that block and injects
`<meta name="robots" content="noindex, nofollow" />`. So only `npm run build`
ships the tags; `build:stg` and `dev` do not.

Consequences to respect when editing `index.html`:

- Anything you add inside the markers will never reach staging or dev.
- The equally.ai accessibility widget lives outside the markers on purpose. It
  is a product feature and must ship everywhere.
- Do not add a `robots.txt` `Disallow` for staging. It would stop crawlers from
  reading the `noindex` meta tag, which is the actual indexing control.

`firebase.json` deliberately has no `rewrites` rule, so staging 404s on unknown
paths exactly as Netlify does. The app has no router; adding an SPA catch-all
would make the environments diverge.

Design and plan documents: `docs/superpowers/specs/` and `docs/superpowers/plans/`.

## Architecture

`App.tsx` holds all of the application's state: the school list and the
selected school id. There is no router, no state library, and no context. State
flows down through `Report.tsx` as props.

### Two unrelated data sources

This is the single most important thing to understand before editing a
component.

**1. Live API, per-school.** `anyway.co.il` endpoints, called with axios
directly inside components, no client layer or caching:

- `App.tsx` fetches `/api/schools-names` once on mount.
- `Report.tsx` fetches three endpoints whenever `selectedId` changes:
  `/api/injured-around-schools`,
  `/api/injured-around-schools-months-graphs-data`, and
  `/api/injured-around-schools-sex-graphs-data`.

These feed the interactive top section (`SchoolSelect`, `Stats`, `Map`).

**2. Hardcoded datasets, transcribed from a printed PDF report.** The aggregate
tables below the interactive section do not call any API. Each component
declares its own dataset as a `const` array at the top of its own file:
`TopCitiesTable`, `MunicipalityTable`, `EducationalClustersTable`,
`TransportationStats`, plus `src/constants/visionZero.ts`.

When a number in one of those tables is wrong, the fix is editing the literal in
that component, not chasing an API. Their shapes are typed in `src/types.ts`
(`CityRanking`, `MunicipalityComparison`, `EducationalCluster`,
`TransportationModeStats`).

### Presentation

- **Typography.** `src/components/Typography.tsx` is the type system: a
  `variant` to Tailwind-class map plus named wrappers (`HeroTitle`,
  `MainContent`, `TableHeader`, `TableBody`, `TableCaption`). Use these rather
  than hand-writing `text-[Npx]` classes, so table and heading sizing stays
  consistent. Background notes in `TYPOGRAPHY_IMPLEMENTATION.md`.
- **Fonts.** Variable fonts `Moses Display` and `Moses Text` are declared with
  `@font-face` in `src/index.css` and served from `public/assets/`. Alef comes
  from Google Fonts via `index.html`.
- **RTL.** `index.html` sets `lang="he" dir="rtl"`. Directional Tailwind
  utilities behave accordingly; prefer logical utilities over `left`/`right`.
- **Charts.** Highcharts, wrapped by the thin `Graph.tsx`. Chart options are
  built by the calling component, mainly `Stats.tsx`.
- **Class merging.** `cn()` in `src/lib/utils.ts` is a plain filter-and-join.
  It is not `tailwind-merge`, so conflicting Tailwind classes are not
  deduplicated; later classes win only by CSS order.

### Tailwind

Tailwind v4 via the `@tailwindcss/vite` plugin, configured CSS-first through
`@import "tailwindcss"` in `src/index.css`.

`tailwind.config.ts` at the repo root is **not loaded**. There is no `@config`
directive in the CSS, and the custom colors it declares (`anywayYellow`,
`anywayOrange`, `anywayRed`) appear nowhere in `src/` and nowhere in the built
CSS. Do not add theme values there and expect them to work. Extend the theme
with `@theme` in `src/index.css` instead.

## Conventions

- Prettier is configured in `.prettierrc`; run `npm run format` rather than
  hand-aligning.
- Hebrew copy is user-facing published content. Never use em dashes (`—`) or en
  dashes (`–`) in it, or anywhere else in this repo.
- `public/` is 24 MB, mostly report imagery and font files. Both hosts serve it
  as-is.
