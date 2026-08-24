# CSV to typed data pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the four 2026 CSV exports into committed, type-checked TypeScript
modules that the report imports, replacing the hand-transcribed literals in
`src/constants/`.

**Architecture:** Four CSVs go into `data/source/2026/`. Five builders under
`scripts/data/` parse them, assert everything they can check, and emit
`.ts` modules into `src/data/`, each ending in a `satisfies` against a type in
`src/types.ts`. `npm run build` already runs `tsc -b`, so a builder that emits a
bad mode id or drops a field fails the production build with no new CI step. A
final `verify.ts` re-imports the written modules and recomputes every percentage
the sources print.

**Tech Stack:** TypeScript 5.8, `tsx` for running the scripts, `node:test` for
the parser unit tests, Prettier's Node API for formatting the emitted source.
No new runtime dependencies.

**Spec:** This document. The design was settled in conversation on 24 August
2026; the rationale sections below are the spec, in the same style as the plan
this file replaces.

## Global Constraints

- **No em dashes or en dashes** anywhere in this repo, including generated
  output and code comments. Hyphens only.
- **Hebrew copy is published content.** `index.html` sets `lang="he" dir="rtl"`.
  Prefer logical Tailwind utilities (`border-s`) over `left`/`right`.
- **No TypeScript enums.** `tsconfig` sets `erasableSyntaxOnly`, which rejects
  them. Use a `const` object plus a same-named type, as `src/types.ts` already
  does for `TransportMode`, `TrendDirection` and `GeolocationStatus`.
- **No `any` without an inline comment** explaining why.
- **Prettier settings are `singleQuote: true`, `semi: false`,
  `trailingComma: "es5"`, `printWidth: 100`.** Run `npm run format` rather than
  hand-aligning.
- **`npm run lint` already fails** on two pre-existing
  `react/no-unescaped-entities` errors in `src/components/Hero.tsx`. Those are
  not regressions and must not be "fixed" as a drive-by. A lint run is clean
  when those two are the only errors.
- **Never run a git command that changes state** (`commit`, `add`, `push`,
  `checkout`, `branch`, `stash`, `reset`, ...) without asking the repo owner
  first and getting explicit approval. The commit steps in this plan are
  written out so the command is known in advance; they still require a yes.
- **Never add a `Co-Authored-By: Claude` trailer** to a commit message.
- **Generated files are committed and never hand edited.** `netlify.toml` runs
  `npm run build` and nothing else, so the pipeline never runs on the build
  server. A generated file missing from git is a broken deploy. A wrong number
  is fixed in the CSV or in the builder, never in `src/data/`.

---

## Why generated `.ts` and not JSON

TypeScript widens the types it infers from a `.json` import. `id` comes back as
`string`, not `TransportMode`. A component importing JSON directly gets no type
safety at all, however carefully the builder that wrote it was typed: a mode id
of `"skooter"` compiles clean, the build passes, and the card simply never
renders. That is not hypothetical. A deleted earlier pipeline emitted
`"scooter"` while `TransportMode` had no such member, and every arithmetic
check passed and `tsc` passed.

Getting real safety out of JSON needs a second module that imports it, asserts
it with `satisfies`, and re-exports typed values. Emitting `.ts` directly
collapses those two files into one, with the assertion sitting in the generated
file.

What is given up: there is no standalone data file to hand to someone who does
not read code. If that turns out to matter, adding a JSON emit alongside is
easy, and the `.ts` stays the thing the app imports.

## Why the percentages are carried, not recomputed

Every percentage the report prints exists in the CSVs as text. The app used to
recompute them from the counts through `formatPercent`, which rounds to one
decimal. Measured against the exports, that made 17 of the 22 printed
percentages differ from the source: the section's headline read `+462.5%` where
the export says `463%`, and the overview card read `+3.7%` where the export says
`+3.67%`.

So the pipeline carries the printed string and the app prints it verbatim.
`formatPercent` is deleted; there is no rounding logic left in the app at all.
The risk this creates, that a source whose percentage disagrees with its own
counts would reach the page unchallenged, is what `verify.ts` exists for: it
recomputes all 22 from the counts, rounds each to the number of decimals its
carried string shows, and compares numerically. That check passes 22 out of 22
on today's data.

This also settles a formatting problem a single rounding rule cannot. The
overview export prints `+3.67%` and `+30%` on the same row, two decimals beside
zero. Matching the source per figure is the only rule that fits both.

## What the sources actually contain

Verified against the files, not assumed.

| | Where |
| --- | --- |
| Previous period counts, per mode | `severity.csv`, explicitly |
| Previous period totals across modes | Nowhere. Summed, and validated by reproducing `+3.67%` and `+30%` |
| Current period totals across modes | `summary.csv` |
| Previous period year range | `severity.csv`, in all five block labels |
| Current period year range | `top-cities.csv` caption only |

No single file names both periods. `severity.csv` prints the counts for both
periods but names only the earlier one; `top-cities.csv` names the current
window and says nothing about the earlier one; `municipality-trend.csv` says
"between the two periods" without naming either. That is why `src/data/periods.ts`
is the one module built from two sources, and why its build asserts that the two
ranges describe one contiguous comparison: the current window must start in the
year the previous one ends, and both must span the same number of years. Without
that check, a mismatched pair of exports would put one window in the caption and
a different one in the cards beneath it, and everything would still compile.

## File structure

```
data/source/2026/
  severity.csv               five blocks, one per transport mode
  top-cities.csv             caption, header, 20 ranked rows
  municipality-trend.csv     caption, two header rows, 15 rows in 4 columns
  summary.csv                title, header, values, percentages

scripts/data/
  lib/paths.ts               the edition constant and the two path helpers
  lib/csv.ts                 text to rows, block splitting, count and year parsing
  lib/percent.ts             precision, half up rounding, sign normalising
  lib/assert.ts              failure helpers
  lib/emit.ts                value to prettier formatted module source
  buildPeriods.ts            severity.csv + top-cities.csv -> periods.ts
  buildTransportation.ts     severity.csv           -> transportation.ts
  buildSummary.ts            summary.csv            -> summary.ts
  buildTopCities.ts          top-cities.csv         -> topCities.ts
  buildMunicipalityTrend.ts  municipality-trend.csv -> municipalityTrend.ts
  verify.ts                  cross file checks against the written modules
  build.ts                   runs the five builders, writes, then verifies

src/data/                    generated, committed, what the app imports
  periods.ts  transportation.ts  summary.ts  topCities.ts  municipalityTrend.ts
```

`src/constants/` is not deleted, it shrinks. `transportationStats.ts` keeps
`CASUALTY_SEVERITIES`, which is presentation configuration rather than data.
`topCities.ts` keeps `mostInjuredCities`, which is a derived cut for the search
panel, so `SchoolSelect`'s import path does not move.

**No year in the generated filenames.** Putting `2026` in a module name
reintroduces exactly the problem that renaming `period2015_2020` to
`previousPeriod` was meant to solve: every edition would change import paths in
every consumer. The year lives in `data/source/2026/` and in the period values.
Next edition: drop the CSVs into `data/source/2027/`, change `EDITION` in
`scripts/data/lib/paths.ts`, run the build, and no import changes.

## Open decisions

Each has a concrete choice made below so the plan is executable. These are the
three worth revisiting after seeing the result on screen.

1. **The transport grid holds five cards now, not four.** Task 10 sets
   `xl:grid-cols-5` with a measurement step. If the severity rows wrap at
   1280px, fall back to `xl:grid-cols-3 2xl:grid-cols-5`.
2. **The municipality table is lopsided.** 15 worsening against 5 improving,
   where the previous edition was 11 against 9. The table pads to the longer
   column, so the improving side gets 10 empty rows. Task 9 keeps the existing
   structure and changes only the data. The imbalance is a real finding, but the
   current layout does not tell it well.
3. **Year ranges print ascending everywhere.** The exports print `2026-2021` in
   visual order while the report prints `2015-2020` ascending in the transport
   section and `2025-2020` visually in the cities table. Task 8 and Task 10
   settle on ascending inside `<span dir="ltr">` in both places.

---

## Task 1: Scaffolding

Moves the sources into place and makes `scripts/` a first class, type-checked
part of the repo. Nothing under `src/` changes.

`tsconfig.node.json` includes only `vite.config.ts`, so `scripts/` would not be
type-checked at all without its own project. That matters: `tsx` strips types
without checking them, so the Hebrew label to `TransportMode` map that Task 6
relies on would never be verified by `tsc -b`.

**Files:**
- Move: `data/*.csv` to `data/source/2026/`
- Create: `tsconfig.scripts.json`
- Create: `scripts/data/lib/paths.ts`
- Modify: `package.json`, `tsconfig.json`, `eslint.config.js`

**Interfaces:**
- Consumes: nothing
- Produces: `EDITION: string`, `sourcePath(name: string): string`,
  `dataPath(name: string): string` from `scripts/data/lib/paths.ts`;
  the `data:build` and `data:test` npm scripts

- [ ] **Step 1: Move the CSVs to stable names**

```bash
mkdir -p data/source/2026
mv "data/df_injured_last_5_years_per_severity_vehicle_pedestrian.csv" data/source/2026/severity.csv
mv "data/scores_per_yishuv_last_5_years.csv"                          data/source/2026/top-cities.csv
mv "data/scores_per_yishuv_5_years_periods_top_20_prat_21_26_sorted_diff_prat.csv" data/source/2026/municipality-trend.csv
mv "data/summary.csv"                                                 data/source/2026/summary.csv
rm -f data/.DS_Store
```

- [ ] **Step 2: Confirm the four files landed**

Run: `ls data/source/2026`
Expected: exactly `municipality-trend.csv  severity.csv  summary.csv  top-cities.csv`

- [ ] **Step 3: Add the dev dependencies**

```bash
npm install --save-dev tsx @types/node
```

`tsx` runs the builders. `@types/node` is what lets `tsc` resolve `node:fs`
inside them. Node 22 can strip types natively with `--experimental-strip-types`,
which would avoid `tsx`, but it prints an experimental warning and its behaviour
is not yet pinned, so the dependency is the quieter choice.

- [ ] **Step 4: Add the npm scripts**

In `package.json`, after `"preview"`:

```json
    "data:build": "tsx scripts/data/build.ts",
    "data:test": "tsx --test scripts/data/lib/*.test.ts",
```

- [ ] **Step 5: Create the scripts TypeScript project**

Create `tsconfig.scripts.json`:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.scripts.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "types": ["node"],
    "skipLibCheck": true,

    "moduleResolution": "bundler",
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["scripts"]
}
```

`include` names only `scripts`. The builders import `src/types.ts`, and `tsc`
follows imports into the program automatically, so `src` does not need listing
and is not compiled twice.

- [ ] **Step 6: Reference it from the root project**

In `tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.scripts.json" }
  ]
}
```

- [ ] **Step 7: Give scripts Node globals in ESLint**

`eslint.config.js` matches `**/*.{ts,tsx}` with `globals.browser`, which would
fail `--max-warnings=0` on anything under `scripts/`. Append a block inside the
`tseslint.config([...])` array, after the existing one:

```js
  {
    files: ['scripts/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
```

- [ ] **Step 8: Create the path helpers**

Create `scripts/data/lib/paths.ts`:

```ts
import { fileURLToPath } from 'node:url'

// The single constant a new edition changes. Drop next year's exports into
// data/source/2027/ under the same four names and change this line.
export const EDITION = '2026'

const REPO_ROOT = new URL('../../../', import.meta.url)

export function sourcePath(name: string): string {
  return fileURLToPath(new URL(`data/source/${EDITION}/${name}`, REPO_ROOT))
}

export function dataPath(name: string): string {
  return fileURLToPath(new URL(`src/data/${name}`, REPO_ROOT))
}
```

Resolved from `import.meta.url` rather than `process.cwd()`, so the builders
work whatever directory they are run from.

- [ ] **Step 9: Create the output directory**

```bash
mkdir -p src/data
```

- [ ] **Step 10: Verify the toolchain**

Run: `npx tsc -b`
Expected: exits 0, no output.

Run: `npm run lint`
Expected: exactly two errors, both `react/no-unescaped-entities` in
`src/components/Hero.tsx`. Anything else is a regression from this task.

- [ ] **Step 11: Commit**

Ask for approval, then:

```bash
git add data/source package.json package-lock.json tsconfig.json tsconfig.scripts.json eslint.config.js scripts/data/lib/paths.ts
git commit -m "chore: add the data pipeline toolchain and commit the 2026 sources"
```

---

## Task 2: CSV parsing

**Files:**
- Create: `scripts/data/lib/csv.ts`
- Test: `scripts/data/lib/csv.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `type Row = string[]`; `parseCsv(text: string): Row[]`;
  `readRows(path: string): Row[]`; `splitBlocks(rows: Row[]): Row[][]`;
  `findRowIndex(rows: Row[], startsWith: string): number`;
  `parseCount(cell: string): number`;
  `type YearRange = { start: number; end: number }`;
  `parseYearRange(cell: string): YearRange`;
  `formatYearRange(range: YearRange): string`

- [ ] **Step 1: Write the failing tests**

Create `scripts/data/lib/csv.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  formatYearRange,
  parseCount,
  parseCsv,
  parseYearRange,
  splitBlocks,
  findRowIndex,
} from './csv'

test('parseCsv keeps a comma that sits inside a quoted field', () => {
  assert.deepEqual(parseCsv('1,ירושלים,"22,239"'), [['1', 'ירושלים', '22,239']])
})

test('parseCsv unescapes a doubled quote', () => {
  assert.deepEqual(parseCsv('a,"סה""כ נפגעים",b'), [['a', 'סה"כ נפגעים', 'b']])
})

test('parseCsv keeps trailing empty cells', () => {
  assert.deepEqual(parseCsv('קורקינט חשמלי,,,מגמה:,317%'), [
    ['קורקינט חשמלי', '', '', 'מגמה:', '317%'],
  ])
})

test('splitBlocks divides on an all empty row and drops it', () => {
  const rows = [['a'], ['b'], ['', '', ''], ['c']]
  assert.deepEqual(splitBlocks(rows), [[['a'], ['b']], [['c']]])
})

test('splitBlocks does not emit a trailing empty block', () => {
  assert.deepEqual(splitBlocks([['a'], ['', '']]), [[['a']]])
})

test('findRowIndex matches on the first cell', () => {
  const rows = [['מגמה:'], ['התקופה הקודמת (2016-2021):', '']]
  assert.equal(findRowIndex(rows, 'התקופה הקודמת'), 1)
})

test('findRowIndex throws when nothing matches', () => {
  assert.throws(() => findRowIndex([['a']], 'b'), /b/)
})

test('parseCount strips a thousands separator', () => {
  assert.equal(parseCount('22,239'), 22239)
})

test('parseCount accepts a whole number written with a decimal zero', () => {
  assert.equal(parseCount('601.0'), 601)
})

test('parseCount rejects a fractional count', () => {
  assert.throws(() => parseCount('601.5'), /whole/)
})

test('parseCount rejects text', () => {
  assert.throws(() => parseCount('הרוגים'), /number/)
})

test('parseYearRange reads the earlier period label', () => {
  assert.deepEqual(parseYearRange('התקופה הקודמת (2016-2021):'), { start: 2016, end: 2021 })
})

test('parseYearRange sorts a visually ordered range', () => {
  assert.deepEqual(
    parseYearRange('20 היישובים בעלי הציון המשוקלל* הגבוה ביותר בין 2026-2021:'),
    { start: 2021, end: 2026 }
  )
})

test('parseYearRange throws when a cell does not hold exactly two years', () => {
  assert.throws(() => parseYearRange('בין 2021:'), /two/)
})

test('formatYearRange prints ascending with a hyphen', () => {
  assert.equal(formatYearRange({ start: 2016, end: 2021 }), '2016-2021')
})
```

Note the second `parseYearRange` case: the leading `20` in the caption is two
digits, so a four digit match does not pick it up.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run data:test`
Expected: FAIL, cannot resolve `./csv`.

- [ ] **Step 3: Write the implementation**

Create `scripts/data/lib/csv.ts`:

```ts
import { readFileSync } from 'node:fs'

export type Row = string[]

export type YearRange = {
  start: number
  end: number
}

// Enough of RFC 4180 for these exports: quoted fields so a thousands separator
// survives, and a doubled quote for a literal one. The cities header carries
// both, in "סה""כ נפגעים".
function parseLine(line: string): Row {
  const cells: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]

    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        cell += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (char === ',' && !quoted) {
      cells.push(cell)
      cell = ''
    } else {
      cell += char
    }
  }

  cells.push(cell)
  return cells
}

export function parseCsv(text: string): Row[] {
  return text.replace(/\r\n/g, '\n').replace(/\n+$/, '').split('\n').map(parseLine)
}

export function readRows(path: string): Row[] {
  return parseCsv(readFileSync(path, 'utf8'))
}

// The severity export separates its five mode blocks with a row of nothing but
// commas. A trailing separator produces no block, so the last mode is not
// followed by an empty one.
export function splitBlocks(rows: Row[]): Row[][] {
  const blocks: Row[][] = []
  let current: Row[] = []

  for (const row of rows) {
    if (row.every((cell) => cell.trim() === '')) {
      if (current.length > 0) blocks.push(current)
      current = []
    } else {
      current.push(row)
    }
  }

  if (current.length > 0) blocks.push(current)
  return blocks
}

// Rows are found by what they say, not by where they sit, so a source that
// gains a row fails on the assertion that follows rather than reading the wrong
// cell silently.
export function findRowIndex(rows: Row[], startsWith: string): number {
  const index = rows.findIndex((row) => row[0].trim().startsWith(startsWith))
  if (index === -1) {
    throw new Error(`no row starting with ${JSON.stringify(startsWith)}`)
  }
  return index
}

// Counts arrive as "22,239" from the score column and as "601.0" from the
// overview. Both are whole numbers of people; a genuinely fractional value
// means the column is not what this parser thinks it is.
export function parseCount(cell: string): number {
  const cleaned = cell.trim().replace(/,/g, '')
  const value = Number(cleaned)

  if (cleaned === '' || !Number.isFinite(value)) {
    throw new Error(`not a number: ${JSON.stringify(cell)}`)
  }
  if (!Number.isInteger(value)) {
    throw new Error(`not a whole count: ${JSON.stringify(cell)}`)
  }
  return value
}

// The captions print their ranges in visual order, so "2026-2021" and
// "2016-2021" both appear and mean ascending ranges. Sort rather than trust the
// order they were written in.
export function parseYearRange(cell: string): YearRange {
  const years = cell.match(/\d{4}/g)
  if (years === null || years.length !== 2) {
    throw new Error(`expected two years in ${JSON.stringify(cell)}`)
  }

  const [start, end] = years.map(Number).sort((a, b) => a - b)
  return { start, end }
}

export function formatYearRange(range: YearRange): string {
  return `${range.start}-${range.end}`
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run data:test`
Expected: 15 passing, 0 failing.

- [ ] **Step 5: Type-check and commit**

Run: `npx tsc -b`
Expected: exits 0.

Ask for approval, then:

```bash
git add scripts/data/lib/csv.ts scripts/data/lib/csv.test.ts
git commit -m "feat: add the CSV parsing helpers for the data pipeline"
```

---

## Task 3: Percentage and assertion helpers

The rounding rule is the delicate part. `Math.round(-0.5)` is `-0` in
JavaScript, because it rounds toward positive infinity, so half up has to be
applied to the magnitude and the sign reapplied afterwards. Pedestrian light
injuries fall 1.235 percent and the export prints `-1%`; rounding the signed
value would give `-1` here by luck and the wrong answer on a true half.

**Files:**
- Create: `scripts/data/lib/percent.ts`, `scripts/data/lib/assert.ts`
- Test: `scripts/data/lib/percent.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `precisionOf(label: string): number`;
  `roundHalfUp(value: number, decimals: number): number`;
  `percentChange(current: number, previous: number): number`;
  `toSignedLabel(cell: string): string` from `percent.ts`.
  `fail(message: string): never`;
  `assertEqual(actual: unknown, expected: unknown, context: string): void`;
  `assertSum(parts: number[], total: number, context: string): void` from
  `assert.ts`.

- [ ] **Step 1: Write the failing tests**

Create `scripts/data/lib/percent.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { percentChange, precisionOf, roundHalfUp, toSignedLabel } from './percent'

test('precisionOf counts the decimals a label shows', () => {
  assert.equal(precisionOf('+317%'), 0)
  assert.equal(precisionOf('-1%'), 0)
  assert.equal(precisionOf('+3.67%'), 2)
  assert.equal(precisionOf('191.4'), 1)
})

test('roundHalfUp rounds a half away from zero, not toward positive infinity', () => {
  assert.equal(roundHalfUp(462.5, 0), 463)
  assert.equal(roundHalfUp(-0.5, 0), -1)
  assert.equal(roundHalfUp(-1.235, 0), -1)
  assert.equal(roundHalfUp(3.6727, 2), 3.67)
})

test('percentChange is the signed change between two counts', () => {
  assert.equal(roundHalfUp(percentChange(90, 16), 0), 463)
  assert.equal(roundHalfUp(percentChange(690, 966), 0), -29)
  assert.equal(roundHalfUp(percentChange(4, 4), 0), 0)
})

test('percentChange refuses a change from zero', () => {
  assert.throws(() => percentChange(5, 0), /zero/)
})

test('toSignedLabel adds a leading plus to a rise', () => {
  assert.equal(toSignedLabel('317%'), '+317%')
})

test('toSignedLabel keeps a minus', () => {
  assert.equal(toSignedLabel('-100%'), '-100%')
})

test('toSignedLabel leaves a flat value unsigned', () => {
  assert.equal(toSignedLabel('0%'), '0%')
})

test('toSignedLabel drops the Hebrew word the overview export prefixes', () => {
  assert.equal(toSignedLabel('עליה +3.67%'), '+3.67%')
  assert.equal(toSignedLabel('עליה +30%'), '+30%')
})

test('toSignedLabel throws when a cell holds no percentage', () => {
  assert.throws(() => toSignedLabel('מגמה:'), /percentage/)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run data:test`
Expected: FAIL, cannot resolve `./percent`.

- [ ] **Step 3: Write percent.ts**

Create `scripts/data/lib/percent.ts`:

```ts
// How many decimals a printed percentage shows. The overview export prints
// "+3.67%" and "+30%" on one row, so there is no single rounding rule that
// matches the sources; each figure is checked at the precision it was written
// with.
export function precisionOf(label: string): number {
  const digits = label.replace(/[^\d.]/g, '')
  const dot = digits.indexOf('.')
  return dot === -1 ? 0 : digits.length - dot - 1
}

// Half up on the magnitude, sign reapplied. Math.round rounds toward positive
// infinity, so Math.round(-0.5) is -0, which is the wrong direction for a
// figure the source rounded by magnitude.
export function roundHalfUp(value: number, decimals: number): number {
  const factor = 10 ** decimals
  const rounded = Math.round(Math.abs(value) * factor) / factor
  return value < 0 ? -rounded : rounded
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) {
    throw new Error('cannot express a change from zero as a percentage')
  }
  return ((current - previous) / previous) * 100
}

// The exports write a rise without a sign ("317%") and prefix the overview
// figures with a word ("עליה +3.67%"). The report prints an explicit sign, so
// the pipeline normalises to the form that will appear on the page.
export function toSignedLabel(cell: string): string {
  const match = cell.trim().match(/([+-]?)(\d+(?:\.\d+)?)%/)
  if (match === null) {
    throw new Error(`no percentage in ${JSON.stringify(cell)}`)
  }

  const [, sign, digits] = match
  if (Number(digits) === 0) return '0%'
  return `${sign === '-' ? '-' : '+'}${digits}%`
}
```

- [ ] **Step 4: Write assert.ts**

Create `scripts/data/lib/assert.ts`:

```ts
// A builder that cannot vouch for a value refuses to emit it. Every failure
// carries enough context to point at the cell that caused it, because the
// person reading the message is looking at a CSV, not at this code.
export function fail(message: string): never {
  throw new Error(message)
}

export function assertEqual(actual: unknown, expected: unknown, context: string): void {
  if (actual !== expected) {
    fail(`${context}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

export function assertSum(parts: number[], total: number, context: string): void {
  const sum = parts.reduce((running, part) => running + part, 0)
  if (sum !== total) {
    fail(`${context}: parts sum to ${sum}, printed total is ${total}`)
  }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run data:test`
Expected: 24 passing, 0 failing.

- [ ] **Step 6: Type-check and commit**

Run: `npx tsc -b`
Expected: exits 0.

Ask for approval, then:

```bash
git add scripts/data/lib/percent.ts scripts/data/lib/percent.test.ts scripts/data/lib/assert.ts
git commit -m "feat: add percentage and assertion helpers for the data pipeline"
```

---

## Task 4: The module emitter

Formatting is delegated to the repo's own Prettier rather than reproduced by
hand. Values are serialised with `JSON.stringify` semantics, which quotes every
key and string with double quotes, and Prettier's `quoteProps: "as-needed"` and
`singleQuote: true` then convert them to the repo's style. That means the
emitted file matches `.prettierrc` by construction, and stays matching if
`.prettierrc` ever changes.

The one thing JSON cannot express is a reference to an existing binding, which
is what `id: TransportMode.EScooter` needs. `raw()` marks a value as a literal
expression to pass through untouched.

**Files:**
- Create: `scripts/data/lib/emit.ts`
- Test: `scripts/data/lib/emit.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `type RawExpression = { __raw: string }`;
  `raw(expression: string): RawExpression`;
  `serialise(value: unknown): string`;
  `type EmittedModule = { outPath: string; source: string }`;
  `emitModule(options: EmitOptions): Promise<EmittedModule>` where
  `EmitOptions = { outPath: string; builder: string; sources: string[]; imports: string; body: string }`

- [ ] **Step 1: Write the failing tests**

Create `scripts/data/lib/emit.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { emitModule, raw, serialise } from './emit'
import { dataPath } from './paths'

// Prettier resolves .prettierrc from the directory of the file it is formatting,
// so the fixture path has to sit inside src/data/ for the repo's settings to
// apply. Nothing is ever written to it.
const FIXTURE = dataPath('__emit_fixture__.ts')

test('serialise quotes keys and strings so prettier can unquote them', () => {
  assert.equal(serialise({ mode: 'קורקינט חשמלי' }), '{"mode":"קורקינט חשמלי"}')
})

test('serialise passes a raw expression through untouched', () => {
  assert.equal(serialise({ id: raw('TransportMode.EScooter') }), '{"id":TransportMode.EScooter}')
})

test('serialise handles nested arrays and objects', () => {
  assert.equal(serialise([{ a: [1, 2] }]), '[{"a":[1,2]}]')
})

test('emitModule writes a generated header naming its builder and sources', async () => {
  const { source } = await emitModule({
    outPath: FIXTURE,
    builder: 'scripts/data/buildExample.ts',
    sources: ['data/source/2026/severity.csv'],
    imports: "import type { Example } from '../types'",
    body: `export const EXAMPLE = ${serialise([{ a: 1 }])} satisfies Example[]`,
  })

  assert.match(source, /Generated by scripts\/data\/buildExample\.ts/)
  assert.match(source, /data\/source\/2026\/severity\.csv/)
  assert.match(source, /npm run data:build/)
})

test('emitModule returns source formatted to the repo prettier settings', async () => {
  const { source } = await emitModule({
    outPath: FIXTURE,
    builder: 'b.ts',
    sources: ['s.csv'],
    imports: "import type { Example } from '../types'",
    body: `export const EXAMPLE = ${serialise([{ a: 1 }])} satisfies Example[]`,
  })

  assert.match(source, /import type \{ Example \} from '\.\.\/types'/)
  assert.ok(!source.includes(';'), 'semi is false in .prettierrc')
  assert.ok(source.endsWith('\n'))
})

test('emitModule refuses an em dash anywhere in the output', async () => {
  await assert.rejects(
    emitModule({
      outPath: FIXTURE,
      builder: 'b.ts',
      sources: ['s.csv'],
      imports: '',
      body: 'export const A = "a \u2014 b"',
    }),
    /dash/
  )
})
```

The em dash in that last test is written as the escape `\u2014` on purpose, so
this plan and the test file itself stay free of the character the repo forbids
while still exercising the guard.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run data:test`
Expected: FAIL, cannot resolve `./emit`.

- [ ] **Step 3: Write the implementation**

Create `scripts/data/lib/emit.ts`:

```ts
import { format, resolveConfig } from 'prettier'

export type RawExpression = {
  __raw: string
}

export type EmitOptions = {
  outPath: string
  builder: string
  sources: string[]
  imports: string
  body: string
}

export type EmittedModule = {
  outPath: string
  source: string
}

// Marks a value as an expression rather than data, so an id can be emitted as
// TransportMode.EScooter instead of a bare string. The generated file reads the
// way the hand written constant it replaces did.
export function raw(expression: string): RawExpression {
  return { __raw: expression }
}

function isRaw(value: object): value is RawExpression {
  return '__raw' in value
}

// Deliberately close to JSON.stringify: every key and string comes out double
// quoted, and prettier then applies the repo's quoteProps and singleQuote
// settings. Formatting rules live in .prettierrc, not here.
export function serialise(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(serialise).join(',')}]`
  }
  if (value !== null && typeof value === 'object') {
    if (isRaw(value)) return value.__raw
    const entries = Object.entries(value).map(([key, item]) => `${JSON.stringify(key)}:${serialise(item)}`)
    return `{${entries.join(',')}}`
  }
  return JSON.stringify(value)
}

export async function emitModule(options: EmitOptions): Promise<EmittedModule> {
  const sources = options.sources.join(' and ')
  const header = [
    `// Generated by ${options.builder} from ${sources}.`,
    '// Do not edit by hand. Run `npm run data:build` to regenerate.',
  ].join('\n')

  const unformatted = [header, options.imports, options.body].filter((part) => part !== '').join('\n\n')

  // The repo forbids em and en dashes in every file, and this code writes
  // files. A Hebrew label that arrives with one is a source problem to fix in
  // the CSV, not something to let through.
  const dash = unformatted.match(/[\u2013\u2014]/)
  if (dash !== null) {
    throw new Error(`generated output for ${options.outPath} contains an em or en dash`)
  }

  const config = await resolveConfig(options.outPath)
  const source = await format(unformatted, { ...config, filepath: options.outPath, parser: 'typescript' })

  return { outPath: options.outPath, source }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run data:test`
Expected: 30 passing, 0 failing.

- [ ] **Step 5: Type-check and commit**

Run: `npx tsc -b`
Expected: exits 0.

Ask for approval, then:

```bash
git add scripts/data/lib/emit.ts scripts/data/lib/emit.test.ts
git commit -m "feat: add the generated module emitter"
```

---

## Task 5: Periods

The first builder, and the one that proves the two exports belong together.
Nothing consumes `REPORT_PERIODS` yet, so the app is untouched and `tsc -b`
stays green.

**Files:**
- Create: `scripts/data/buildPeriods.ts`, `scripts/data/build.ts`
- Create (generated): `src/data/periods.ts`
- Modify: `src/types.ts`

**Interfaces:**
- Consumes: `sourcePath`, `dataPath`; `readRows`, `splitBlocks`, `findRowIndex`,
  `parseYearRange`, `formatYearRange`; `fail`; `emitModule`, `serialise`
- Produces: `type ReportPeriods = { previous: string; current: string }` in
  `src/types.ts`; `buildPeriods(): Promise<EmittedModule>`;
  `REPORT_PERIODS` in `src/data/periods.ts`

- [ ] **Step 1: Add the type**

In `src/types.ts`, above `MunicipalityComparison`:

```ts
// The two windows the whole report compares, both read from the exports rather
// than written here. Shared by the transport section and the cities table, so
// the caption above one cannot drift from the caption above the other.
// Rendered inside dir="ltr" wherever it prints, so bidi cannot reorder it.
export type ReportPeriods = {
  previous: string
  current: string
}
```

- [ ] **Step 2: Write the builder**

Create `scripts/data/buildPeriods.ts`:

```ts
import { fail } from './lib/assert'
import { findRowIndex, formatYearRange, parseYearRange, readRows, splitBlocks } from './lib/csv'
import { emitModule, serialise, type EmittedModule } from './lib/emit'
import { dataPath, sourcePath } from './lib/paths'

const PREVIOUS_LABEL = 'התקופה הקודמת'

// No single export names both periods. The severity export prints the counts
// for both but labels only the earlier one; the cities caption names the
// current window and says nothing about the earlier one. So the pair is read
// from two files, and the check below is what makes it safe to print them in
// one sentence.
export async function buildPeriods(): Promise<EmittedModule> {
  const blocks = splitBlocks(readRows(sourcePath('severity.csv')))
  if (blocks.length !== 5) {
    fail(`severity.csv: expected 5 mode blocks, found ${blocks.length}`)
  }

  const ranges = blocks.map((block) =>
    parseYearRange(block[findRowIndex(block, PREVIOUS_LABEL)][0])
  )
  const [previous] = ranges
  for (const range of ranges) {
    if (range.start !== previous.start || range.end !== previous.end) {
      fail(
        `severity.csv: the five blocks disagree on the earlier period, ` +
          `${formatYearRange(previous)} against ${formatYearRange(range)}`
      )
    }
  }

  const cities = readRows(sourcePath('top-cities.csv'))
  const current = parseYearRange(cities[0][0])

  if (current.start !== previous.end) {
    fail(
      `the periods are not contiguous: previous ends ${previous.end}, ` +
        `current starts ${current.start}`
    )
  }
  const previousSpan = previous.end - previous.start
  const currentSpan = current.end - current.start
  if (previousSpan !== currentSpan) {
    fail(`the periods differ in length: ${previousSpan} years against ${currentSpan}`)
  }

  const value = {
    previous: formatYearRange(previous),
    current: formatYearRange(current),
  }

  return emitModule({
    outPath: dataPath('periods.ts'),
    builder: 'scripts/data/buildPeriods.ts',
    sources: ['data/source/2026/severity.csv', 'data/source/2026/top-cities.csv'],
    imports: "import type { ReportPeriods } from '../types'",
    body: `export const REPORT_PERIODS = ${serialise(value)} satisfies ReportPeriods`,
  })
}
```

- [ ] **Step 3: Write the orchestrator**

Create `scripts/data/build.ts`:

```ts
import { writeFileSync } from 'node:fs'
import { buildPeriods } from './buildPeriods'

const builders = [buildPeriods]

for (const build of builders) {
  const { outPath, source } = await build()
  writeFileSync(outPath, source, 'utf8')
  console.log(`wrote ${outPath}`)
}
```

Builders are added to this array as each task lands. `verify.ts` joins it in
Task 11.

- [ ] **Step 4: Run the build**

Run: `npm run data:build`
Expected: `wrote .../src/data/periods.ts`, exit 0.

- [ ] **Step 5: Check the output**

Run: `cat src/data/periods.ts`
Expected, exactly:

```ts
// Generated by scripts/data/buildPeriods.ts from data/source/2026/severity.csv and data/source/2026/top-cities.csv.
// Do not edit by hand. Run `npm run data:build` to regenerate.

import type { ReportPeriods } from '../types'

export const REPORT_PERIODS = {
  previous: '2016-2021',
  current: '2021-2026',
} satisfies ReportPeriods
```

- [ ] **Step 6: Confirm the emitted file needs no reformatting**

Run: `npx prettier --check src/data/periods.ts`
Expected: `All matched files use Prettier code style!`

- [ ] **Step 7: Type-check, lint and commit**

Run: `npx tsc -b`
Expected: exits 0.

Run: `npm run lint`
Expected: the two known `Hero.tsx` errors and nothing else.

Ask for approval, then:

```bash
git add src/types.ts scripts/data/buildPeriods.ts scripts/data/build.ts src/data/periods.ts
git commit -m "feat: derive the report periods from the exports"
```

---

## Task 6: The transport section

The largest task, and it cannot be split. Changing `toDelta` to take the carried
string breaks every caller at once, and its callers span the mode cards, the
section, and the overview card. The overview card's numbers come from
`summary.csv` rather than from the transport totals, so summary has to land in
the same change or the card has nothing to read. Splitting any of it leaves the
build red between two tasks.

`TRANSPORTATION_TOTALS` is deleted and not regenerated. `grep` confirms its only
consumer was `CasualtyOverviewCard`, and every figure that card prints is in
`summary.csv` verbatim. The summed previous period totals stay inside the
pipeline as the quantity that proves `+3.67%` and `+30%`.

**Files:**
- Create: `scripts/data/buildTransportation.ts`, `scripts/data/buildSummary.ts`
- Create (generated): `src/data/transportation.ts`, `src/data/summary.ts`
- Modify: `src/types.ts`, `src/lib/transportationTrend.ts`,
  `src/constants/transportationStats.ts`,
  `src/components/TransportationModeCard.tsx`,
  `src/components/TransportationStats.tsx`,
  `src/components/CasualtyOverviewCard.tsx`,
  `src/components/PreviousPeriodLine.tsx`
- Modify: `scripts/data/build.ts`

**Interfaces:**
- Consumes: everything from Tasks 2 to 5
- Produces: `type CasualtyChanges = Record<keyof CasualtyCounts, string>` and
  `type SummaryFigure = { label: string; value: number; change: string }` in
  `src/types.ts`; `TransportationModeStats` gains `changes: CasualtyChanges`;
  `toDelta(percent: string): CasualtyDelta`;
  `TRANSPORTATION_MODES` in `src/data/transportation.ts`;
  `REPORT_SUMMARY` in `src/data/summary.ts`

- [ ] **Step 1: Add the two types and extend the third**

In `src/types.ts`, replacing the existing `TransportationModeStats`:

```ts
// The printed change for each figure a mode card shows, keyed to mirror
// CasualtyCounts so a card can read changes[key] beside currentPeriod[key] in
// the same loop. Record rather than four written out fields, so adding a
// severity to CasualtyCounts fails to compile until every mode carries its
// change too.
export type CasualtyChanges = Record<keyof CasualtyCounts, string>

// Transportation mode statistics
// Period keys are deliberately generic. They named their year ranges until the
// 2026 edition, which meant renaming a field in six files every time the report
// moved on a year; now only the values in REPORT_PERIODS change.
//
// changes carries the percentage the source printed rather than one derived at
// render time. The exports print 463% where recomputing gives 462.5%, and the
// published page follows the source. scripts/data/verify.ts recomputes all of
// them from the counts and fails the build on a disagreement.
export type TransportationModeStats = {
  id: TransportMode
  mode: string
  previousPeriod: CasualtyCounts
  currentPeriod: CasualtyCounts
  changes: CasualtyChanges
}

// One of the two figures the overview card leads with. The overview export
// describes that card completely: both labels, both counts and both changes,
// so all three come from it rather than being split across the file and the
// component.
export type SummaryFigure = {
  label: string
  value: number
  change: string
}
```

- [ ] **Step 2: Write the transportation builder**

Create `scripts/data/buildTransportation.ts`:

```ts
import { TransportMode, type TransportationModeStats } from '../../src/types'
import { assertEqual, assertSum, fail } from './lib/assert'
import { findRowIndex, parseCount, readRows, splitBlocks, type Row } from './lib/csv'
import { emitModule, raw, serialise, type EmittedModule } from './lib/emit'
import { dataPath, sourcePath } from './lib/paths'
import { toSignedLabel } from './lib/percent'

// The point of writing this in TypeScript rather than in a scripting language.
// The map is typed against the enum, so a Hebrew label mapped to a mode the
// report does not have will not compile, and an unrecognised label in the CSV
// is an error rather than a quietly skipped row.
const MODES: Record<string, TransportMode> = {
  'קורקינט חשמלי': TransportMode.EScooter,
  'הולכי רגל': TransportMode.Pedestrian,
  'אופניים חשמליים': TransportMode.EBike,
  'אופניים רגילים': TransportMode.Bike,
  'קורקינט לא חשמלי': TransportMode.Scooter,
}

const MODE_KEYS: Record<TransportMode, string> = {
  [TransportMode.EScooter]: 'EScooter',
  [TransportMode.Pedestrian]: 'Pedestrian',
  [TransportMode.EBike]: 'EBike',
  [TransportMode.Bike]: 'Bike',
  [TransportMode.Scooter]: 'Scooter',
}

// Only the first two characters, because the label is written with a gershayim
// (סה״כ) rather than a straight quote and matching the whole word means pasting
// a character that is easy to get wrong.
const TOTAL_LABEL = 'סה'
const PREVIOUS_LABEL = 'התקופה הקודמת'
const SEVERITY_HEADER = ['הרוגים', 'פצועים קשה', 'פצועים קל']

// A block is seven rows. Two of them are found by content, and the counts are
// then read at fixed offsets from the earlier period label:
//
//   0  mode name, then מגמה: and the total change
//   1  סה״כ נפגעים:, current total, לעומת, previous total
//   2  the severity header                       previousIndex - 3
//   3  current counts                            previousIndex - 2
//   4  current changes                           previousIndex - 1
//   5  התקופה הקודמת (YYYY-YYYY):                previousIndex
//   6  previous counts                           previousIndex + 1
//
// The header row is asserted rather than skipped, so a source that gains or
// loses a row fails here instead of reading counts out of the wrong line.
function readMode(block: Row[]): TransportationModeStats {
  const label = block[0][0].trim()
  const id = MODES[label]
  if (id === undefined) {
    fail(`severity.csv: unrecognised transport mode ${JSON.stringify(label)}`)
  }

  const totalsRow = block[findRowIndex(block, TOTAL_LABEL)]
  const currentTotal = parseCount(totalsRow[1])
  const previousTotal = parseCount(totalsRow[3])

  const previousIndex = findRowIndex(block, PREVIOUS_LABEL)
  if (previousIndex < 3 || previousIndex + 1 >= block.length) {
    fail(`severity.csv: ${label} block is not the expected seven rows`)
  }

  SEVERITY_HEADER.forEach((expected, column) => {
    assertEqual(
      block[previousIndex - 3][column].trim(),
      expected,
      `${label}, severity header column ${column}`
    )
  })

  const [currentDeaths, currentSevere, currentLight] = block[previousIndex - 2]
    .slice(0, 3)
    .map(parseCount)
  const [deathsChange, severeChange, lightChange] = block[previousIndex - 1]
    .slice(0, 3)
    .map(toSignedLabel)
  const [previousDeaths, previousSevere, previousLight] = block[previousIndex + 1]
    .slice(0, 3)
    .map(parseCount)

  assertSum([currentDeaths, currentSevere, currentLight], currentTotal, `${label}, current period`)
  assertSum(
    [previousDeaths, previousSevere, previousLight],
    previousTotal,
    `${label}, previous period`
  )

  return {
    id,
    mode: label,
    previousPeriod: {
      totalInjured: previousTotal,
      lightInjuries: previousLight,
      severeInjuries: previousSevere,
      deaths: previousDeaths,
    },
    currentPeriod: {
      totalInjured: currentTotal,
      lightInjuries: currentLight,
      severeInjuries: currentSevere,
      deaths: currentDeaths,
    },
    changes: {
      totalInjured: toSignedLabel(block[0][4]),
      lightInjuries: lightChange,
      severeInjuries: severeChange,
      deaths: deathsChange,
    },
  }
}

export async function buildTransportation(): Promise<EmittedModule> {
  const blocks = splitBlocks(readRows(sourcePath('severity.csv')))
  if (blocks.length !== 5) {
    fail(`severity.csv: expected 5 mode blocks, found ${blocks.length}`)
  }

  const parsed = blocks.map(readMode)
  const seen = new Set(parsed.map((mode) => mode.id))
  if (seen.size !== parsed.length) {
    fail('severity.csv: the same transport mode appears in more than one block')
  }

  // Order comes from the export, which leads with the electric scooter, the
  // mode the section exists to report. Preserved rather than sorted by count,
  // which would bury a 317% rise under a category that is falling.
  const value = parsed.map((mode) => ({
    ...mode,
    id: raw(`TransportMode.${MODE_KEYS[mode.id]}`),
  }))

  return emitModule({
    outPath: dataPath('transportation.ts'),
    builder: 'scripts/data/buildTransportation.ts',
    sources: ['data/source/2026/severity.csv'],
    imports: "import { TransportMode, type TransportationModeStats } from '../types'",
    body: `export const TRANSPORTATION_MODES = ${serialise(value)} satisfies TransportationModeStats[]`,
  })
}
```

- [ ] **Step 3: Write the summary builder**

Create `scripts/data/buildSummary.ts`:

```ts
import { assertEqual, fail } from './lib/assert'
import { parseCount, readRows } from './lib/csv'
import { emitModule, serialise, type EmittedModule } from './lib/emit'
import { dataPath, sourcePath } from './lib/paths'
import { toSignedLabel } from './lib/percent'

// The overview export is four rows: a title, the two labels, the two counts,
// and the two changes. It is a complete description of CasualtyOverviewCard,
// which is why the labels are emitted alongside the numbers rather than left
// in the component. Generated files are committed, so a source that reworded a
// label shows up as a diff in review.
export async function buildSummary(): Promise<EmittedModule> {
  const rows = readRows(sourcePath('summary.csv'))
  if (rows.length !== 4) {
    fail(`summary.csv: expected 4 rows, found ${rows.length}`)
  }

  const [labels, counts, changes] = rows.slice(1)
  assertEqual(labels.length, 2, 'summary.csv label row')

  const value = labels.map((label, column) => {
    const trimmed = label.trim()
    if (trimmed === '') fail(`summary.csv: empty label in column ${column}`)
    return {
      label: trimmed,
      value: parseCount(counts[column]),
      change: toSignedLabel(changes[column]),
    }
  })

  return emitModule({
    outPath: dataPath('summary.ts'),
    builder: 'scripts/data/buildSummary.ts',
    sources: ['data/source/2026/summary.csv'],
    imports: "import type { SummaryFigure } from '../types'",
    body: `export const REPORT_SUMMARY = ${serialise(value)} satisfies SummaryFigure[]`,
  })
}
```

- [ ] **Step 4: Register both builders**

In `scripts/data/build.ts`:

```ts
import { writeFileSync } from 'node:fs'
import { buildPeriods } from './buildPeriods'
import { buildSummary } from './buildSummary'
import { buildTransportation } from './buildTransportation'

const builders = [buildPeriods, buildTransportation, buildSummary]

for (const build of builders) {
  const { outPath, source } = await build()
  writeFileSync(outPath, source, 'utf8')
  console.log(`wrote ${outPath}`)
}
```

- [ ] **Step 5: Run the build and check the output**

Run: `npm run data:build && cat src/data/transportation.ts src/data/summary.ts`

Expected: five mode entries in the export's order, the first of which reads

```ts
  {
    id: TransportMode.EScooter,
    mode: 'קורקינט חשמלי',
    previousPeriod: { totalInjured: 182, lightInjuries: 163, severeInjuries: 16, deaths: 3 },
    currentPeriod: { totalInjured: 759, lightInjuries: 665, severeInjuries: 90, deaths: 4 },
    changes: {
      totalInjured: '+317%',
      lightInjuries: '+308%',
      severeInjuries: '+463%',
      deaths: '+33%',
    },
  },
```

and the last of which is `TransportMode.Scooter`, `'קורקינט לא חשמלי'`, with
`previousPeriod` totalling 35, `currentPeriod` totalling 145, and changes
`'+314%'`, `'+343%'`, `'+200%'`, `'-100%'`.

And `src/data/summary.ts`:

```ts
export const REPORT_SUMMARY = [
  { label: 'סה״כ נפגעים', value: 6690, change: '+3.67%' },
  { label: 'פצועים קשה + הרוגים', value: 601, change: '+30%' },
] satisfies SummaryFigure[]
```

- [ ] **Step 6: Rewrite the trend helper**

Replace the whole body of `src/lib/transportationTrend.ts`:

```ts
import { TrendDirection, type CasualtyDelta } from '../types'

// Every figure in this section counts injured or killed people, so more is
// always the bad direction. These two words are what the reader actually reads;
// the color and the arrow only repeat them.
const TREND_LABELS: Record<TrendDirection, string> = {
  [TrendDirection.Up]: 'עלייה',
  [TrendDirection.Down]: 'ירידה',
  [TrendDirection.Flat]: 'ללא שינוי',
}

// The percentage arrives already formatted, carried from the export by the data
// pipeline, so there is no rounding here and no way for the page to disagree
// with the source. All this adds is the direction and the word, which the pill
// needs and a string does not carry.
export function toDelta(percent: string): CasualtyDelta {
  const value = Number(percent.replace('%', ''))
  const direction =
    value > 0 ? TrendDirection.Up : value < 0 ? TrendDirection.Down : TrendDirection.Flat

  return { direction, percent, label: TREND_LABELS[direction] }
}

export function formatCount(value: number): string {
  return value.toLocaleString('he-IL')
}
```

`formatPercent` and `toSevereOrKilled` are gone. `grep` confirms
`toSevereOrKilled` had one consumer, the overview card, and Step 8 removes it.

- [ ] **Step 7: Shrink the constants file**

`src/constants/transportationStats.ts` keeps only `CASUALTY_SEVERITIES`:

```ts
import { type CasualtyCounts } from '../types'

// The three severities every card breaks its total into, worst first so the
// eye meets the deaths before the sprains. `short` is the same column inside
// the previous-period line, where the full names would wrap the row.
//
// Presentation rather than data, which is why this is the one thing left in
// this file: the counts and the periods are generated into src/data/.
export const CASUALTY_SEVERITIES: {
  key: keyof CasualtyCounts
  label: string
  short: string
}[] = [
  { key: 'deaths', label: 'הרוגים', short: 'הרוגים' },
  { key: 'severeInjuries', label: 'פצועים קשה', short: 'קשה' },
  { key: 'lightInjuries', label: 'פצועים קל', short: 'קל' },
]
```

- [ ] **Step 8: Point the overview card at the summary**

In `src/components/CasualtyOverviewCard.tsx`, replace the imports and the
`OVERVIEW` constant, and the `dl` body:

```tsx
import React from 'react'
import { REPORT_SUMMARY } from '../data/summary'
import { formatCount, toDelta } from '../lib/transportationTrend'
import { cn } from '../lib/utils'
import TrendPill from './TrendPill'
import Typography from './Typography'

type Props = {
  className?: string
}

// Its own component because it renders in two places at two widths: up in the
// article on narrow screens, and at the head of the transport breakdown on wide
// ones. Only one is ever displayed. The caller passes the visibility, so this
// file does not have to know which of the two placements it is.
//
// Both figures rose this edition: more people hurt, and a larger share of them
// badly. Printed side by side because either one alone tells half the story.
export const CasualtyOverviewCard: React.FC<Props> = ({ className }) => (
  <div className={cn('rounded-lg border border-gray-200 p-4', className)}>
    <Typography
      variant="table-header"
      className="mb-3 border-b border-gray-200 pb-3 text-center text-gray-700"
    >
      מבט על · סה״כ נפגעים מכל הסוגים
    </Typography>
    <dl className="grid grid-cols-2 gap-3">
      {REPORT_SUMMARY.map((figure) => (
        <div key={figure.label} className="text-center">
          <dt>
            <Typography variant="table-body" as="span" className="text-gray-600">
              {figure.label}
            </Typography>
          </dt>
          <dd>
            {/* Proportional figures, not tabular. Nothing here lines up into a
                column, and Moses Text's tabular set gives the thousands comma a
                full digit advance, which opens 6,690 into "6 , 690". */}
            <span className="my-2 block font-text text-[32px] leading-none font-extrabold text-gray-800">
              {formatCount(figure.value)}
            </span>
            <TrendPill delta={toDelta(figure.change)} />
          </dd>
        </div>
      ))}
    </dl>
  </div>
)

export default CasualtyOverviewCard
```

- [ ] **Step 9: Point the mode card at the carried changes**

In `src/components/TransportationModeCard.tsx`, change line 30 and the severity
pill. Destructure `changes` alongside the two periods:

```tsx
  const { previousPeriod: before, currentPeriod: after, changes } = stats
  const totalDelta = toDelta(changes.totalInjured)
```

and inside the `CASUALTY_SEVERITIES` map, replace the `TrendPill`:

```tsx
              <TrendPill delta={toDelta(changes[key])} size={TrendPillSize.Compact} />
```

- [ ] **Step 10: Point the section at the generated modules**

In `src/components/TransportationStats.tsx`, replace the imports and the
headline constants at the top of the file:

```tsx
import { useState } from 'react'
import { REPORT_PERIODS } from '../data/periods'
import { TRANSPORTATION_MODES } from '../data/transportation'
import { TransportMode } from '../types'
import CasualtyOverviewCard from './CasualtyOverviewCard'
import TransportationModeCard from './TransportationModeCard'
import Typography, { TableCaption } from './Typography'

// The finding the section exists for. Looked up by id rather than taken from
// index 0: the order of TRANSPORTATION_MODES comes from the export now, and
// nothing guarantees which row leads it.
const scooter = TRANSPORTATION_MODES.find((mode) => mode.id === TransportMode.EScooter)

if (scooter === undefined) {
  throw new Error('TRANSPORTATION_MODES is missing the electric scooter row the section leads with')
}

// Read off the data rather than written into the copy, so the sentence cannot
// drift from the cards under it if a number is ever corrected.
const scooterTotalRise = scooter.changes.totalInjured
const scooterSevereRise = scooter.changes.severeInjuries
```

Then replace the two `TRANSPORTATION_PERIODS` references in the caption with
`REPORT_PERIODS`:

```tsx
          השוואה בין התקופות: <span dir="ltr">{REPORT_PERIODS.previous}</span> מול{' '}
          <span dir="ltr">{REPORT_PERIODS.current}</span>
```

And update the comment above `CasualtyOverviewCard` in that file, which says the
overview reports a fall. Replace it with:

```tsx
            {/* The two summaries share a row once there is width for it. They
                are a pair: the overview gives the scale of the rise across
                every mode, the alert says which mode is driving it, and side by
                side that reads as one thought rather than two stacked
                announcements. */}
```

- [ ] **Step 11: Point the previous-period line at the generated periods**

In `src/components/PreviousPeriodLine.tsx`, change the import and the reference:

```tsx
import { CASUALTY_SEVERITIES } from '../constants/transportationStats'
import { REPORT_PERIODS } from '../data/periods'
```

```tsx
      {REPORT_PERIODS.previous}
```

- [ ] **Step 12: Type-check**

Run: `npx tsc -b`
Expected: exits 0. A failure here naming `TRANSPORTATION_TOTALS` or
`period2020_2025` means a consumer was missed.

- [ ] **Step 13: Check the page in the browser**

Run: `npm run dev`
Expected: the transport section shows five cards, the electric scooter card
leads with `עלייה +317%`, its severe injury pill reads `+463%`, and the overview
card reads 6,690 with `עלייה +3.67%` and 601 with `עלייה +30%`.

- [ ] **Step 14: Lint, format and commit**

Run: `npm run format && npm run lint`
Expected: the two known `Hero.tsx` errors and nothing else. `git diff` on
`src/data/` after `npm run format` must be empty, which is what proves the
emitter matches `.prettierrc`.

Ask for approval, then:

```bash
git add src/types.ts src/lib/transportationTrend.ts src/constants/transportationStats.ts src/components/CasualtyOverviewCard.tsx src/components/TransportationModeCard.tsx src/components/TransportationStats.tsx src/components/PreviousPeriodLine.tsx scripts/data/buildTransportation.ts scripts/data/buildSummary.ts scripts/data/build.ts src/data/transportation.ts src/data/summary.ts
git commit -m "feat: generate the transport section data from the 2026 exports"
```

---

## Task 7: Top cities

**Files:**
- Create: `scripts/data/buildTopCities.ts`
- Create (generated): `src/data/topCities.ts`
- Modify: `src/constants/topCities.ts`, `src/components/TopCitiesTable.tsx`,
  `scripts/data/build.ts`

**Interfaces:**
- Consumes: Tasks 2 to 5
- Produces: `buildTopCities(): Promise<EmittedModule>`; `TOP_CITIES` in
  `src/data/topCities.ts`

- [ ] **Step 1: Write the builder**

Create `scripts/data/buildTopCities.ts`:

```ts
import type { CityRanking } from '../../src/types'
import { assertEqual, assertSum, fail } from './lib/assert'
import { parseCount, readRows } from './lib/csv'
import { emitModule, serialise, type EmittedModule } from './lib/emit'
import { dataPath, sourcePath } from './lib/paths'

const EXPECTED_COLUMNS = 8
const EXPECTED_ROWS = 20

export async function buildTopCities(): Promise<EmittedModule> {
  const rows = readRows(sourcePath('top-cities.csv'))
  const data = rows.slice(2)

  assertEqual(rows[1].length, EXPECTED_COLUMNS, 'top-cities.csv header')
  assertEqual(data.length, EXPECTED_ROWS, 'top-cities.csv row count')

  const cities: CityRanking[] = data.map((row, index) => {
    assertEqual(row.length, EXPECTED_COLUMNS, `top-cities.csv row ${index + 1}`)

    const rank = parseCount(row[0])
    if (rank !== index + 1) {
      fail(`top-cities.csv: rank ${rank} in position ${index + 1}, ranks must run 1 to 20 in order`)
    }

    const cityName = row[1].trim()
    if (cityName === '') fail(`top-cities.csv: empty city name at rank ${rank}`)

    const deaths = parseCount(row[2])
    const severeInjuries = parseCount(row[3])
    const lightInjuries = parseCount(row[4])
    const totalInjured = parseCount(row[5])

    assertSum([deaths, severeInjuries, lightInjuries], totalInjured, `${cityName}, severities`)

    return {
      rank,
      cityName,
      compositeScore: parseCount(row[7]),
      totalAccidents: parseCount(row[6]),
      totalInjured,
      lightInjuries,
      severeInjuries,
      deaths,
    }
  })

  // The table is ranked by the weighted score, so a score that rises as the
  // rank falls means the export was sorted by something else.
  for (let index = 1; index < cities.length; index += 1) {
    if (cities[index].compositeScore > cities[index - 1].compositeScore) {
      fail(
        `top-cities.csv: ${cities[index].cityName} scores higher than ` +
          `${cities[index - 1].cityName} but is ranked below it`
      )
    }
  }

  return emitModule({
    outPath: dataPath('topCities.ts'),
    builder: 'scripts/data/buildTopCities.ts',
    sources: ['data/source/2026/top-cities.csv'],
    imports: "import type { CityRanking } from '../types'",
    body: `export const TOP_CITIES = ${serialise(cities)} satisfies CityRanking[]`,
  })
}
```

- [ ] **Step 2: Register it**

In `scripts/data/build.ts`, add the import and append `buildTopCities` to the
`builders` array.

- [ ] **Step 3: Run and check**

Run: `npm run data:build && head -20 src/data/topCities.ts`
Expected: rank 1 is

```ts
  {
    rank: 1,
    cityName: 'ירושלים',
    compositeScore: 22239,
    totalAccidents: 811,
    totalInjured: 845,
    lightInjuries: 742,
    severeInjuries: 96,
    deaths: 7,
  },
```

Run: `tail -14 src/data/topCities.ts`
Expected: rank 20 is `אלעד`, composite score 111. Note that `מודיעין עילית`
leaves the top 20 this edition and `אלעד` enters it.

- [ ] **Step 4: Shrink the constants file to the derived cut**

Replace `src/constants/topCities.ts` entirely:

```ts
import { TOP_CITIES } from '../data/topCities'
import { type CityRanking } from '../types'

// The head of the ranked table cut by a different measure: raw casualties
// rather than the composite score the table ranks by. The search's empty state
// offers these as shortcuts, and a list that prints counts has to be ordered by
// the counts it prints, or it reads as a bug. Both cuts come from the same
// published rows.
export const mostInjuredCities: CityRanking[] = [...TOP_CITIES]
  .sort((a, b) => b.totalInjured - a.totalInjured)
  .slice(0, 6)
```

`SchoolSelect` imports `mostInjuredCities` from this path and does not change.

- [ ] **Step 5: Point the table at the generated data**

In `src/components/TopCitiesTable.tsx`, change the import:

```tsx
import { TOP_CITIES } from '../data/topCities'
import { REPORT_PERIODS } from '../data/periods'
```

Replace the hardcoded caption, which still says 2025-2020, with the generated
period. Ascending inside an explicit ltr run, matching how the transport section
prints its ranges:

```tsx
        <TableCaption className="text-center">
          20 היישובים בעלי הציון המשוקלל* הגבוה ביותר בין{' '}
          <span dir="ltr">{REPORT_PERIODS.current}</span>:
        </TableCaption>
```

And change `topCitiesData.map` to `TOP_CITIES.map`.

- [ ] **Step 6: Verify**

Run: `npx tsc -b && npm run format && npm run lint`
Expected: `tsc` exits 0, `git diff src/data` is empty after formatting, lint
shows the two known `Hero.tsx` errors only.

Run: `npm run dev` and check the cities table shows 20 rows headed by ירושלים
with a score of 22,239, ends at אלעד, and the caption reads `2021-2026`.

- [ ] **Step 7: Commit**

Ask for approval, then:

```bash
git add scripts/data/buildTopCities.ts scripts/data/build.ts src/data/topCities.ts src/constants/topCities.ts src/components/TopCitiesTable.tsx
git commit -m "feat: generate the top cities table from the 2026 export"
```

---

## Task 8: Municipality trend

The percentages here are carried as strings for the same reason as everywhere
else, and with a wrinkle: the worsening column shows one decimal and the
improving column shows none, and one value is written `69.0`. Carrying the text
keeps the column exactly as the source published it.

`percentChange` becomes a string and `trend` is dropped. `grep` confirms
`MunicipalityTable` never reads `trend`: the split into worsening and improving
is already carried by which array a row is in, so the field was duplicating the
array it lived in. The sign is still checked, at build time, where it belongs.

**Files:**
- Create: `scripts/data/buildMunicipalityTrend.ts`
- Create (generated): `src/data/municipalityTrend.ts`
- Modify: `src/types.ts`, `src/components/MunicipalityTable.tsx`,
  `scripts/data/build.ts`

**Interfaces:**
- Consumes: Tasks 2 to 5
- Produces: `MunicipalityComparison` becomes
  `{ cityName: string; percentChange: string }`;
  `buildMunicipalityTrend(): Promise<EmittedModule>`;
  `MUNICIPALITY_WORSENING` and `MUNICIPALITY_IMPROVING` in
  `src/data/municipalityTrend.ts`

- [ ] **Step 1: Change the type**

In `src/types.ts`, replace `MunicipalityComparison`:

```ts
// One row of the worsening or improving column. percentChange is the text the
// export printed, not a number, because the source publishes one decimal in one
// column and none in the other and prints 69.0 rather than 69. Rendering a
// parsed number would silently drop that digit.
//
// There is no trend field: which of the two arrays a row is in already says
// which direction it moved, and the sign is asserted when the file is built.
export type MunicipalityComparison = {
  cityName: string
  percentChange: string
}
```

- [ ] **Step 2: Write the builder**

Create `scripts/data/buildMunicipalityTrend.ts`:

```ts
import type { MunicipalityComparison } from '../../src/types'
import { assertEqual, fail } from './lib/assert'
import { readRows, type Row } from './lib/csv'
import { emitModule, serialise, type EmittedModule } from './lib/emit'
import { dataPath, sourcePath } from './lib/paths'

const EXPECTED_COLUMNS = 4

type Direction = {
  name: 'worsening' | 'improving'
  nameColumn: number
  valueColumn: number
  isExpectedSign: (value: number) => boolean
}

const DIRECTIONS: Direction[] = [
  { name: 'worsening', nameColumn: 0, valueColumn: 1, isExpectedSign: (value) => value > 0 },
  { name: 'improving', nameColumn: 2, valueColumn: 3, isExpectedSign: (value) => value < 0 },
]

function readColumn(rows: Row[], direction: Direction): MunicipalityComparison[] {
  const entries: MunicipalityComparison[] = []

  for (const row of rows) {
    const cityName = row[direction.nameColumn].trim()
    if (cityName === '') continue

    const percentChange = row[direction.valueColumn].trim()
    const value = Number(percentChange)

    if (percentChange === '' || !Number.isFinite(value)) {
      fail(`municipality-trend.csv: ${cityName} has no numeric change`)
    }
    if (!direction.isExpectedSign(value)) {
      fail(
        `municipality-trend.csv: ${cityName} is listed under ${direction.name} ` +
          `with a change of ${percentChange}`
      )
    }

    entries.push({ cityName, percentChange })
  }

  return entries
}

export async function buildMunicipalityTrend(): Promise<EmittedModule> {
  const rows = readRows(sourcePath('municipality-trend.csv'))
  assertEqual(rows[2].length, EXPECTED_COLUMNS, 'municipality-trend.csv header')

  const data = rows.slice(3)
  const [worsening, improving] = DIRECTIONS.map((direction) => readColumn(data, direction))

  if (worsening.length === 0 || improving.length === 0) {
    fail('municipality-trend.csv: one of the two columns is empty')
  }

  const names = [...worsening, ...improving].map((entry) => entry.cityName)
  if (new Set(names).size !== names.length) {
    fail('municipality-trend.csv: a municipality appears in both columns')
  }

  const body = [
    `export const MUNICIPALITY_WORSENING = ${serialise(worsening)} satisfies MunicipalityComparison[]`,
    `export const MUNICIPALITY_IMPROVING = ${serialise(improving)} satisfies MunicipalityComparison[]`,
  ].join('\n\n')

  return emitModule({
    outPath: dataPath('municipalityTrend.ts'),
    builder: 'scripts/data/buildMunicipalityTrend.ts',
    sources: ['data/source/2026/municipality-trend.csv'],
    imports: "import type { MunicipalityComparison } from '../types'",
    body,
  })
}
```

- [ ] **Step 3: Register it**

In `scripts/data/build.ts`, add the import and append `buildMunicipalityTrend`.

- [ ] **Step 4: Run and check**

Run: `npm run data:build && cat src/data/municipalityTrend.ts`
Expected: `MUNICIPALITY_WORSENING` has 15 entries starting
`{ cityName: 'בית שמש', percentChange: '191.4' }` and including
`{ cityName: 'חולון', percentChange: '69.0' }` with the decimal zero intact.
`MUNICIPALITY_IMPROVING` has 5 entries starting
`{ cityName: 'רמלה', percentChange: '-22' }`.

- [ ] **Step 5: Point the table at the generated data**

In `src/components/MunicipalityTable.tsx`, delete both local arrays and the
`MunicipalityComparison` type import, and import the data instead:

```tsx
import { MUNICIPALITY_IMPROVING, MUNICIPALITY_WORSENING } from '../data/municipalityTrend'
import { TableCaption, TableHeader, TableBody } from './Typography'
```

Replace the two `Array.from` bindings:

```tsx
            {Array.from({
              length: Math.max(MUNICIPALITY_IMPROVING.length, MUNICIPALITY_WORSENING.length),
            }).map((_, rowIndex) => {
              const improvementItem = MUNICIPALITY_IMPROVING[rowIndex]
              const worseningItem = MUNICIPALITY_WORSENING[rowIndex]
```

- [ ] **Step 6: Fix the two cells**

The worsening cell used `worseningItem?.percentChange || ''`, which prints
nothing for a value of 0. The improving cell moved the minus sign to the end of
the string by hand, producing `22-`. Both are replaced by an explicit ltr run,
which is how every other signed number in this report is kept in order:

```tsx
                  <TableBody className="p-3 text-right border-r border-gray-300 bg-red-50 whitespace-nowrap">
                    {worseningItem && <span dir="ltr">{worseningItem.percentChange}</span>}
                  </TableBody>
```

```tsx
                  <TableBody className="p-3 text-right bg-green-50 whitespace-nowrap">
                    {improvementItem && <span dir="ltr">{improvementItem.percentChange}</span>}
                  </TableBody>
```

- [ ] **Step 7: Verify**

Run: `npx tsc -b && npm run format && npm run lint`
Expected: `tsc` exits 0, `git diff src/data` empty after formatting, lint shows
the two known `Hero.tsx` errors only.

Run: `npm run dev` and check the table. The worsening column has 15 rows headed
by בית שמש at 191.4, the improving column has 5 headed by רמלה at -22 rendered
with the minus leading, and the improving column is blank from row 6 down.

- [ ] **Step 8: Commit**

Ask for approval, then:

```bash
git add src/types.ts scripts/data/buildMunicipalityTrend.ts scripts/data/build.ts src/data/municipalityTrend.ts src/components/MunicipalityTable.tsx
git commit -m "feat: generate the municipality trend table from the 2026 export"
```

---

## Task 9: Verification

Runs last, against the modules that were written to disk rather than values held
in memory, so a bug in the emitter is caught as well as a bug in a parser. On
failure it exits non-zero and leaves the files in place, so the diff is
readable; `git checkout src/data` reverts them.

Every check below passes on today's data.

**Files:**
- Create: `scripts/data/verify.ts`
- Modify: `scripts/data/build.ts`

**Interfaces:**
- Consumes: the five generated modules; `percentChange`, `precisionOf`,
  `roundHalfUp`; `assertSum`, `fail`; `parseYearRange`
- Produces: `verify(): Promise<void>`

- [ ] **Step 1: Write the verifier**

Create `scripts/data/verify.ts`:

```ts
import { MUNICIPALITY_IMPROVING, MUNICIPALITY_WORSENING } from '../../src/data/municipalityTrend'
import { REPORT_PERIODS } from '../../src/data/periods'
import { REPORT_SUMMARY } from '../../src/data/summary'
import { TOP_CITIES } from '../../src/data/topCities'
import { TRANSPORTATION_MODES } from '../../src/data/transportation'
import type { CasualtyCounts } from '../../src/types'
import { assertSum, fail } from './lib/assert'
import { parseYearRange } from './lib/csv'
import { percentChange, precisionOf, roundHalfUp } from './lib/percent'

const SEVERITIES: (keyof CasualtyCounts)[] = ['deaths', 'severeInjuries', 'lightInjuries']

// The check the whole carried-percentage decision rests on. The page prints
// what the export printed, so nothing else would notice an export whose
// percentage disagrees with its own counts. Compared at the precision the
// carried string shows, because the overview export prints two decimals beside
// none on the same row.
function checkChange(current: number, previous: number, printed: string, context: string): void {
  const computed = roundHalfUp(percentChange(current, previous), precisionOf(printed))
  const stated = Number(printed.replace('%', ''))

  if (computed !== stated) {
    fail(`${context}: counts give ${computed}%, the source printed ${printed}`)
  }
}

function sumOf(pick: (counts: CasualtyCounts) => number, period: 'previousPeriod' | 'currentPeriod') {
  return TRANSPORTATION_MODES.reduce((running, mode) => running + pick(mode[period]), 0)
}

export async function verify(): Promise<void> {
  // 1. Every mode's severities add up to its printed total, in both periods,
  //    and every carried percentage matches its counts.
  for (const mode of TRANSPORTATION_MODES) {
    for (const period of ['previousPeriod', 'currentPeriod'] as const) {
      const counts = mode[period]
      assertSum(
        SEVERITIES.map((key) => counts[key]),
        counts.totalInjured,
        `${mode.mode}, ${period}`
      )
    }

    for (const key of ['totalInjured', ...SEVERITIES] as (keyof CasualtyCounts)[]) {
      checkChange(
        mode.currentPeriod[key],
        mode.previousPeriod[key],
        mode.changes[key],
        `${mode.mode}, ${key}`
      )
    }
  }

  // 2. The five modes add up to the overview export, and the previous period
  //    total, which is printed nowhere, reproduces both of its percentages.
  const currentTotal = sumOf((counts) => counts.totalInjured, 'currentPeriod')
  const previousTotal = sumOf((counts) => counts.totalInjured, 'previousPeriod')
  const currentSevere =
    sumOf((counts) => counts.severeInjuries, 'currentPeriod') +
    sumOf((counts) => counts.deaths, 'currentPeriod')
  const previousSevere =
    sumOf((counts) => counts.severeInjuries, 'previousPeriod') +
    sumOf((counts) => counts.deaths, 'previousPeriod')

  const [total, severeOrKilled] = REPORT_SUMMARY
  if (total.value !== currentTotal) {
    fail(`the five modes total ${currentTotal}, the overview prints ${total.value}`)
  }
  if (severeOrKilled.value !== currentSevere) {
    fail(`the five modes give ${currentSevere} severe or killed, the overview prints ${severeOrKilled.value}`)
  }

  checkChange(currentTotal, previousTotal, total.change, 'overview, total injured')
  checkChange(currentSevere, previousSevere, severeOrKilled.change, 'overview, severe or killed')

  // 3. The ranked table.
  if (TOP_CITIES.length !== 20) fail(`expected 20 ranked cities, found ${TOP_CITIES.length}`)
  TOP_CITIES.forEach((city, index) => {
    if (city.rank !== index + 1) fail(`rank ${city.rank} sits in position ${index + 1}`)
    assertSum(
      [city.deaths, city.severeInjuries, city.lightInjuries],
      city.totalInjured,
      `${city.cityName}, severities`
    )
  })

  // 4. The trend lists cover the ranked table exactly. Nothing in either export
  //    states this, and it is the strongest cross check the four files allow.
  const ranked = new Set(TOP_CITIES.map((city) => city.cityName))
  const listed = [...MUNICIPALITY_WORSENING, ...MUNICIPALITY_IMPROVING].map((entry) => entry.cityName)

  if (new Set(listed).size !== listed.length) fail('a municipality is listed twice in the trend table')
  if (listed.length !== ranked.size) {
    fail(`the trend table lists ${listed.length} municipalities, the ranked table has ${ranked.size}`)
  }
  for (const name of listed) {
    if (!ranked.has(name)) fail(`${name} is in the trend table but not in the ranked table`)
  }

  // 5. The two periods still describe one contiguous comparison.
  const previous = parseYearRange(REPORT_PERIODS.previous)
  const current = parseYearRange(REPORT_PERIODS.current)
  if (current.start !== previous.end) {
    fail(`the periods are not contiguous: ${REPORT_PERIODS.previous} then ${REPORT_PERIODS.current}`)
  }
  if (previous.end - previous.start !== current.end - current.start) {
    fail(`the periods differ in length: ${REPORT_PERIODS.previous} against ${REPORT_PERIODS.current}`)
  }

  console.log('verified 22 percentages, 30 severity sums and 4 cross file checks')
}
```

- [ ] **Step 2: Run it from the build**

`scripts/data/build.ts` becomes:

```ts
import { writeFileSync } from 'node:fs'
import { buildMunicipalityTrend } from './buildMunicipalityTrend'
import { buildPeriods } from './buildPeriods'
import { buildSummary } from './buildSummary'
import { buildTopCities } from './buildTopCities'
import { buildTransportation } from './buildTransportation'
import { verify } from './verify'

const builders = [
  buildPeriods,
  buildTransportation,
  buildSummary,
  buildTopCities,
  buildMunicipalityTrend,
]

for (const build of builders) {
  const { outPath, source } = await build()
  writeFileSync(outPath, source, 'utf8')
  console.log(`wrote ${outPath}`)
}

// Reads what was just written rather than what was held in memory, so a bug in
// the emitter fails here too. A failure leaves the files on disk so the diff can
// be read; git checkout src/data reverts them.
await verify()
```

- [ ] **Step 3: Run the full pipeline**

Run: `npm run data:build`
Expected: five `wrote ...` lines, then
`verified 22 percentages, 30 severity sums and 4 cross file checks`, exit 0.

- [ ] **Step 4: Prove the verifier actually fails**

Break the source rather than the generated file, since the build regenerates
`src/data/` before verifying and would overwrite any edit made there.

In `data/source/2026/severity.csv`, change the electric scooter's severe injury
percentage on line 5 from `463%` to `470%`, leaving the counts alone:

```
33%,470%,308%,,
```

Run: `npm run data:build`
Expected: exits non-zero with
`קורקינט חשמלי, severeInjuries: counts give 463%, the source printed +470%`.
The five files are still written, which is the intended behaviour: the diff
stays readable.

Restore the source and rebuild:

```bash
git checkout data/source/2026/severity.csv
npm run data:build
```

Expected: the verification line, exit 0. Confirm `git status` shows no change to
`src/data/`.

- [ ] **Step 5: Type-check, lint and commit**

Run: `npx tsc -b && npm run lint`
Expected: `tsc` exits 0, lint shows the two known `Hero.tsx` errors only.

Ask for approval, then:

```bash
git add scripts/data/verify.ts scripts/data/build.ts
git commit -m "feat: verify every generated figure against the exports"
```

---

## Task 10: Layout and copy

The 2026 numbers falsify things the components say about themselves, and the
fifth transport mode does not fit the grid the section was built for.

**Files:**
- Modify: `src/components/TransportationStats.tsx`, `CLAUDE.md`

**Interfaces:**
- Consumes: everything above
- Produces: nothing new

- [ ] **Step 1: Widen the grid for five cards**

In `src/components/TransportationStats.tsx`, the card list is
`grid-cols-1 gap-3 lg:grid-cols-2 lg:items-stretch xl:grid-cols-4`. Five cards
in a four column row leave an orphan, and in a two column row they go 2, 2, 1.
Change it to:

```tsx
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:items-stretch xl:grid-cols-5">
```

and replace the comment above it, which still explains the four across
calculation:

```tsx
          {/* Five across at xl, three at lg. The page container caps this
              section at 809px on a 1024px screen, which is why the full row
              waits for the width that lets a card keep its severity rows on one
              line rather than being served broken.

              items-stretch is what makes the panels a set rather than loose
              cards: equal height, so their bottom rows share a line. */}
```

- [ ] **Step 2: Measure it**

Run: `npm run dev`

Check at 1280px and at 1440px that no severity row inside a card wraps, and that
the מגמה pill and the mode name still fit. If a row wraps at 1280px, use
`lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-5` instead, so the five across
layout waits for the width that supports it. Record which of the two was chosen
in the commit message.

- [ ] **Step 3: Update CLAUDE.md**

`CLAUDE.md` currently says every aggregate table is a hardcoded literal declared
at the top of its own component. Three of the five are generated now. In the
"Two unrelated data sources" section, replace the second entry:

```markdown
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
```

And in the Commands table, add:

```markdown
| `npm run data:build`  | Regenerate `src/data/` from `data/source/`, then verify it            |
| `npm run data:test`   | Unit tests for the pipeline's parsing helpers (`node:test`)          |
```

The "no test framework" note in that file needs a qualifier, since `data:test`
now exists. Change it to say there is no test framework for the app; the
pipeline's parsing helpers are covered by `node:test` through
`npm run data:test`.

- [ ] **Step 4: Full verification**

Run: `npm run data:build`
Expected: five writes and the verification line.

Run: `npm run build`
Expected: `tsc -b` passes and Vite writes `dist/`.

Run: `npm run format && git diff --stat src/data`
Expected: no diff. This is the proof that the emitter's output matches
`.prettierrc`.

Run: `npm run lint`
Expected: the two known `Hero.tsx` errors only.

- [ ] **Step 5: Check the whole page**

Run: `npm run dev`

Walk the report and confirm:
- The transport section caption reads `2016-2021` מול `2021-2026`.
- Five cards, the electric scooter leading with `עלייה +317%` and a `+463%`
  severe injuries pill, and a קורקינט לא חשמלי card showing `עלייה +314%`.
- The overview card reads 6,690 with `עלייה +3.67%` and 601 with `עלייה +30%`,
  in both its placements: in the article on a narrow screen and in the section
  on a wide one.
- The cities table caption reads `2021-2026`, 20 rows, ירושלים first at 22,239
  and אלעד last at 111.
- The search panel's shortcut cities are the six with the most casualties, not
  the six highest ranked: ירושלים, תל אביב יפו, אשדוד, בני ברק, פתח תקווה,
  נתניה, in that order.
- The municipality table shows 15 worsening rows and 5 improving, with `191.4`
  and `69.0` intact and `-22` reading with the minus first.

- [ ] **Step 6: Commit**

Ask for approval, then:

```bash
git add src/components/TransportationStats.tsx CLAUDE.md
git commit -m "feat: fit the transport grid to five modes and document the pipeline"
```

---

## Not in this plan

- `EducationalClustersTable` and `src/constants/visionZero.ts` stay hand
  transcribed. Neither has a CSV in this hand over.
- The municipality table's shape. 15 worsening against 5 improving leaves 10
  empty cells, and the imbalance is a genuine finding this layout does not tell
  well. Changing the table structure is an editorial and design decision, not a
  data one.
- A JSON emit alongside the `.ts`. Easy to add if someone needs a data file to
  read without opening the code, and the `.ts` stays what the app imports.
