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
| `npm run data:build`  | Regenerate `src/data/` from `data/source/`, then verify it            |
| `npm run data:test`   | Unit tests for the pipeline's parsing helpers (`node:test`)           |

There is no test framework for the app and no `test` script. Verification of
the app means building and asserting on `dist/` output, or checking the
deployed URL. The data pipeline's parsing helpers are the exception: they are
covered by `node:test` and run with `npm run data:test`.

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

**1. Live API, per-school.** anyway endpoints, called with axios directly inside
components. There is no client layer and no caching; the only shared piece is
`src/constants/api.ts`, which holds the host and one URL builder per endpoint so
the host is written once.

- `App.tsx` fetches `/api/schools-names` once on mount.
- `Report.tsx` fetches three endpoints whenever `selectedId` changes:
  `/api/injured-around-schools`,
  `/api/injured-around-schools-months-graphs-data`, and
  `/api/injured-around-schools-sex-graphs-data`.

These feed the interactive top section (`SchoolSelect`, `Stats`, `Map`).

#### Which anyway build to point at

anyway runs two deployments of the same server
([`data-for-change/anyway`](https://github.com/data-for-change/anyway)):
`www.anyway.co.il` on `master` and `www.dfc2.anyway.co.il` on `new-cbs-format`.

Everything in this app points at **dfc2**, and that is not a preference. www
serves accident years 2020 through 2025; dfc2 serves 2021 through 2026. Only
dfc2 matches the edition this report is written against, so `API_BASE_URL` in
`src/constants/api.ts` and `MAP_BASE_URL` in `src/constants/map.ts` have to name
the same host. Splitting them puts the map and the numbers printed beside it on
different editions of the data.

The partial years at each end of dfc2's range sum to about one full year, which
puts its real window at June 2021 to May 2026. That is where the
`start_date=2021-06-01` and `end_date=2026-05-31` in `MAP_EMBED_FILTERS` come
from, and why `years` in `Stats.tsx` runs 2021 to 2026. Those three values move
together or not at all.

#### The endpoints are S3 dumps, not queries

`anyway/views/schools/api.py` on the server does not query the database for any
of these four routes. It reads four precomputed JSON files out of the S3 bucket
`dfc-anyway` under `schools_report/output/`, keyed by school id as a string, and
returns one entry. Two consequences:

- The route being reachable says nothing about the data behind it being
  populated. A stale or bad export is invisible from the outside except as
  wrong or empty content.
- The lookup is `all_data[school_id]` with no default, so any id not in the
  file is a **500**, not a 404 or an empty list. Ids come from
  `/api/schools-names`, so normal use never hits it, but nothing in
  `Report.tsx` catches these rejections either.

`schools_names.json` is written by `anyway/parsers/schools_with_description.py`.
The other three files come from a Jupyter notebook, one per edition, in
`anyway/parsers/`: `schools_2022.ipynb` through `schools_2024.ipynb`, and for
this edition `schools_2025_empty_output.ipynb`. The notebook reads 5,607
per-school CSVs, aggregates them, writes the three JSON files and uploads them
straight to `schools_report/output/`, overwriting what the API serves. So these
files are reproducible from the repo, but only by rerunning a notebook by hand
against inputs that are not in it.

The schools API is **byte-identical on both branches**. So any difference in
what www and dfc2 answer is a difference in the S3 files or in what each
process has cached, never a difference in code. `load_school_file_from_s3` is
wrapped in a bare `@lru_cache`, with no TTL, so each worker reads a file once
and then serves that copy until it restarts. A build can therefore answer with
data that no longer exists in S3.

#### Known gap: the monthly chart has no data on dfc2

`/api/injured-around-schools-months-graphs-data` answers `200` with `[]` for
every school on dfc2, checked against 250 of them. The route is fine; the
export behind it is empty, and the notebook above shows why.

The notebook builds the months file and the sex file with the same code shape:
group by `school_id` plus one label column, count, bucket per school. The sex
file is correct and the months file is empty, and the only thing that differs
is the label column. `sex_hebrew` arrives from the CSVs ready to use.
`accident_month_hebrew` is derived, in a single line:

```python
df['accident_month_hebrew'] = df['accident_month'].apply(lambda m: months_dict.get(m))
```

`months_dict` is keyed by the integers 1 to 12. A `.get` miss returns `None`
rather than raising, and pandas `groupby` drops `None` keys by default, so if
`accident_month` does not arrive from `pd.read_csv` as a number, every row maps
to `None`, the grouping produces zero rows, and all 5,607 schools get `[]`. The
column has to exist, or that line would raise, so the value type is what
changed in the new CBS format. Nothing in the notebook asserts the mapping
worked, which is why this shipped silently, and why the file is named
`schools_2025_empty_output.ipynb`.

That is anyway's fix, in their notebook, not ours. Reporting it is more useful
than working around it.

Do not "fix" the chart by pointing that one call at www either. It would print
June 2020 to May 2025 months beside June 2021 to May 2026 yearly figures, and
www's copy is a cached pre-2026 file, so it would break with no warning at the
next restart. Note that www serving the whole old file set, 2020 to 2025 with
working months, while dfc2 serves the whole new set, is exactly what the
`lru_cache` predicts: the notebook overwrote every file at once, and only dfc2
has reread them.

`Stats.tsx` guards the section with `monthStats.length > 0` rather than a bare
truthiness check, because `[]` is truthy and an unguarded render draws twelve
empty bars that read as "no accidents all year". While the export is empty the
heading and chart are simply absent, and they come back on their own once it is
fixed, with no code change.

#### When testing these endpoints by hand

These routes intermittently answer with a schema summary rather than data, like
`[{accident_year: int, ...}] (3)`, which is not valid JSON and will crash a
parser. It is not tied to any request header worth chasing. Retry the request
until it parses instead of concluding the endpoint is broken or empty.

**2. Generated datasets, built from committed CSV exports.** The aggregate
tables below the interactive section do not call any API. Their numbers are
generated into `src/data/` by the pipeline in `scripts/data/`, which reads the
CSVs in `data/source/<edition>/`, asserts everything it can check, and emits
`.ts` modules ending in a `satisfies` against a type in `src/types.ts`. Run it
with `npm run data:build`.

`src/data/` is committed and never hand edited: `netlify.toml` runs only
`npm run build`, so the pipeline does not run on the build server, and the next
`data:build` overwrites anything typed into a generated file. A wrong number is
fixed in the CSV or in the builder.

`TopCitiesTable`, `MunicipalityTable`, `TransportationStats` and
`CasualtyOverviewCard` read from `src/data/`. `EducationalClustersTable` and
`src/constants/visionZero.ts` are still hand transcribed literals; when a number
in one of those is wrong, that literal is the fix.

Percentages are carried from the exports as text rather than recomputed, so the
page prints exactly what the source published. `scripts/data/verify.ts`
recomputes all of them from the counts and fails the run on a disagreement. See
`docs/superpowers/plans/2026-08-24-csv-data-pipeline.md` for why.

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
