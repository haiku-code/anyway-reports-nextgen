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
