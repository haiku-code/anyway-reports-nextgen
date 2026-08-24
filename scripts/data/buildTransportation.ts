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
//
// The value type admits undefined so that the lookup below can be checked. The
// safety this map exists for is unaffected: every value written here is still
// checked against TransportMode.
const MODES: Record<string, TransportMode | undefined> = {
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
