import React from 'react'
import { TRANSPORTATION_MODES } from '../data/transportation'
import { magnitude } from '../lib/transportationTrend'
import { cn } from '../lib/utils'
import { TransportMode, type TransportationModeStats } from '../types'
import Typography from './Typography'

type Props = {
  className?: string
}

// The rows the findings quote, looked up by id rather than by index: the order
// of TRANSPORTATION_MODES comes from the export now, and nothing guarantees
// which row leads it.
//
// Wrapped in a function so the constants below bind checked rows. A bare
// `if (row === undefined) throw` narrows only the module body, and the findings
// are read inside a component, where the narrowing does not reach.
function citedMode(id: TransportMode): TransportationModeStats {
  const row = TRANSPORTATION_MODES.find((mode) => mode.id === id)
  if (row === undefined) {
    throw new Error(`TRANSPORTATION_MODES is missing the "${id}" row a key finding cites`)
  }
  return row
}

const eScooter = citedMode(TransportMode.EScooter)
const pedestrian = citedMode(TransportMode.Pedestrian)
const scooter = citedMode(TransportMode.Scooter)

// Red on the figure, ink on the sentence around it. Tinting four findings end
// to end would be a wall of red, and past a certain amount of it the eye stops
// separating the alarming number from the clause that qualifies it. The panel
// keeps its tint and its edge, so the section still reads as the alarm.
const FIGURE = 'font-bold text-trend-up'

// Percentages are read off the data rather than written into the copy, so a
// sentence here cannot drift from the cards under it if a number is ever
// corrected.
//
// The severity finding is the one exception, and it is deliberate: it states
// 3.7% and 30.1%, where the summary export prints +3.67% and +30% and
// CasualtyOverviewCard beside this panel prints those. Both pairs are correct,
// 6,453 to 6,690 and 462 to 601 at different precision. Editing
// data/source/2026/summary.csv would bring the card into line, and was declined,
// so these two stay literals. Note ReportArticle also says 30% twice, once
// inside a quotation that cannot be edited.
const KEY_FINDINGS: { id: string; text: React.ReactNode }[] = [
  {
    id: 'e-scooter-severe',
    text: (
      <>
        זינוק חסר תקדים של{' '}
        <strong className={FIGURE}>{magnitude(eScooter.changes.severeInjuries)}</strong> במספר
        הפצועים קשה בקורקינט חשמלי
      </>
    ),
  },
  {
    id: 'pedestrians',
    text: (
      <>
        הולכי רגל נותרו האוכלוסייה הפגיעה והקטלנית ביותר, עם עלייה של{' '}
        <strong className={FIGURE}>{magnitude(pedestrian.changes.deaths)}</strong> בהרוגים ו-
        <strong className={FIGURE}>{magnitude(pedestrian.changes.severeInjuries)}</strong> בפצועים
        קשה
      </>
    ),
  },
  {
    id: 'severity-shift',
    text: (
      <>
        החמרה קיצונית בחומרת התאונות: מספר הנפגעים הכללי עלה ב-
        <strong className={FIGURE}>3.7%</strong> בלבד, אך שיעור הנפגעים קשה וההרוגים זינק ב-
        <strong className={FIGURE}>30.1%</strong>
      </>
    ),
  },
  {
    id: 'scooter-severe',
    text: (
      <>
        שילוש במספר הפצועים קשה (עלייה של{' '}
        <strong className={FIGURE}>{magnitude(scooter.changes.severeInjuries)}</strong>) בקורקינטים
        לא חשמליים
      </>
    ),
  },
]

// The findings the section exists for, in one panel rather than one per box:
// they are four readings of the same shift, and splitting them into separate
// cards would ask the reader to work out that they belong together.
//
// A list rather than four paragraphs, so a screen reader announces how many
// there are before reading the first one, and so the dots give the eye a column
// to come back to on a re-scan.
export const KeyFindingsPanel: React.FC<Props> = ({ className }) => (
  // Fenced by a heavy edge on the side the text starts from as well as tinted,
  // so it reads as set apart from the cards even where the tint does not
  // survive. border-s, not border-r, so it stays on the reading edge.
  <div
    className={cn(
      'rounded-lg border border-gray-200 border-s-4 border-s-trend-up bg-trend-up-surface/50 p-4',
      className
    )}
  >
    <Typography variant="table-header" className="mb-3 flex items-center gap-2 text-trend-up">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-5 shrink-0"
      >
        <path d="m3 17 6-6 4 4 8-8m-6 0h6v6" />
      </svg>
      ממצאים מרכזיים
    </Typography>

    <ul className="space-y-2.5">
      {KEY_FINDINGS.map((finding) => (
        <li key={finding.id} className="flex gap-2.5">
          {/* Decorative: the panel is already a list, and its heading and the
              red figures say what kind. mt-2 sits the dot on the optical centre
              of the first line rather than its top edge. */}
          <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-trend-up" />
          <Typography variant="table-body" as="p" className="leading-relaxed text-gray-700">
            {finding.text}
          </Typography>
        </li>
      ))}
    </ul>
  </div>
)

export default KeyFindingsPanel
