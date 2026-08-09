import { useState } from 'react'
import { TRANSPORTATION_MODES, TRANSPORTATION_PERIODS } from '../constants/transportationStats'
import { toDelta } from '../lib/transportationTrend'
import { TransportMode } from '../types'
import CasualtyOverviewCard from './CasualtyOverviewCard'
import TransportationModeCard from './TransportationModeCard'
import Typography, { TableCaption } from './Typography'

// The finding the section exists for. Both figures are read off the data rather
// than written into the copy, so the sentence cannot drift from the cards under
// it if a number is ever corrected.
const scooter = TRANSPORTATION_MODES[0]
const scooterTotalRise = toDelta(
  scooter.period2020_2025.totalInjured,
  scooter.period2015_2020.totalInjured
).percent
const scooterSevereRise = toDelta(
  scooter.period2020_2025.severeInjuries,
  scooter.period2015_2020.severeInjuries
).percent

export default function TransportationStats() {
  // Independent rather than single-open: the panels are one line each, and
  // closing a card the reader opened earlier would shift everything below it
  // just as they arrive there. The scooter card starts open because it is the
  // one whose previous-period counts explain the headline.
  const [expanded, setExpanded] = useState<TransportMode[]>([scooter.id])

  const toggle = (mode: TransportMode) =>
    setExpanded((current) =>
      current.includes(mode) ? current.filter((id) => id !== mode) : [...current, mode]
    )

  return (
    <div className="w-full mb-16">
      {/* Same tinted cap and white body the tables above this one use, so the
          section keeps its place in the page's rhythm even though what sits
          inside it is cards rather than rows. */}
      <div
        className="rounded-t-lg border border-gray-200 p-4"
        style={{ backgroundColor: '#E8F7FC' }}
      >
        <TableCaption className="text-center">נפגעים בסביבת מוסדות לימוד</TableCaption>
        <Typography variant="table-body" className="mt-1 text-center text-gray-600">
          השוואה בין התקופות: <span dir="ltr">{TRANSPORTATION_PERIODS.previous}</span> מול{' '}
          <span dir="ltr">{TRANSPORTATION_PERIODS.current}</span>
        </Typography>
      </div>

      <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg p-4">
        {/* Narrow screens read the cards one after another, so the column stays
            measured rather than stretching to the width of the tables above.
            From lg the cards go four across and the section takes the full
            width, because that is what lets a reader compare the modes. */}
        <div className="mx-auto max-w-[560px] lg:max-w-none">
          {/* The two summaries share a row once there is width for it. They are
              a pair: the overview says casualties fell, the alert says which
              mode is the exception, and side by side that reads as one thought
              rather than two stacked announcements. */}
          <div className="lg:mb-5 lg:grid lg:grid-cols-2 lg:gap-4">
            {/* Wide screens only. Narrow ones show this card up in the article,
                rendered from the same component. Swapped with responsive classes
                rather than a viewport hook, so there is no first-paint flash of
                the wrong one, and display:none keeps the hidden copy out of the
                accessibility tree rather than reading the figures out twice. */}
            <CasualtyOverviewCard className="mb-3 hidden md:block lg:mb-0" />

            {/* Fenced by a heavy edge on the side the text starts from as well
                as tinted, so it reads as set apart from the cards even where the
                tint does not survive. border-s, not border-r, so it stays on the
                reading edge. */}
            {/* Centred rather than top-aligned: the grid stretches this box to
                the overview card's height, and its three lines of text would
                otherwise sit against the top edge over a pool of empty tint. */}
            <div className="mb-5 rounded-lg border border-gray-200 border-s-4 border-s-trend-up bg-trend-up-surface/50 p-4 lg:mb-0 lg:flex lg:flex-col lg:justify-center">
              <Typography
                variant="table-header"
                className="mb-2 flex items-center gap-2 text-trend-up"
              >
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
                מגמת הזינוק · קורקינטים חשמליים
              </Typography>
              <Typography variant="table-body" as="p" className="leading-relaxed text-trend-up">
                נרשמה עלייה חסרת תקדים של{' '}
                <strong dir="ltr" className="font-bold">
                  {scooterTotalRise}
                </strong>{' '}
                בסה״כ הנפגעים מקורקינטים חשמליים, וזינוק של{' '}
                <strong dir="ltr" className="font-bold">
                  {scooterSevereRise}
                </strong>{' '}
                במספר הפצועים קשה.
              </Typography>
            </div>
          </div>

          <Typography variant="table-header" className="mb-3 text-gray-700">
            פילוח לפי אמצעי תחבורה
          </Typography>

          {/* Two across at lg, four only at xl. The page container caps this
              section at 809px on a 1024px screen, which leaves 185px per card
              in a four-column row: narrower than the 195px a severity row needs,
              so the text overflowed and the rows stopped lining up. Four across
              is the point of the layout, so it waits for the width that lets it
              work rather than being served broken.

              items-stretch is what makes the panels a set rather than loose
              cards: equal height, so their bottom rows share a line. */}
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-stretch xl:grid-cols-4">
            {TRANSPORTATION_MODES.map((stats) => (
              <TransportationModeCard
                key={stats.id}
                stats={stats}
                expanded={expanded.includes(stats.id)}
                onToggle={() => toggle(stats.id)}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
