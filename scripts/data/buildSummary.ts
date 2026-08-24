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
