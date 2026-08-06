import { useState } from 'react'
import {
  TRANSPORTATION_MODES,
  TRANSPORTATION_PERIODS,
  TRANSPORTATION_TOTALS,
} from '../constants/transportationStats'
import { formatCount, toDelta, toSevereOrKilled } from '../lib/transportationTrend'
import { TransportMode } from '../types'
import TransportationModeCard from './TransportationModeCard'
import TrendPill from './TrendPill'
import Typography, { TableCaption } from './Typography'

const { period2015_2020: totalsBefore, period2020_2025: totalsAfter } = TRANSPORTATION_TOTALS

// The two figures the section opens on. Total casualties fell, yet the count of
// people killed or badly hurt rose: one number on its own tells the wrong
// story, so they are printed side by side and the reader gets both at once.
const OVERVIEW = [
  {
    label: 'סה״כ נפגעים',
    value: totalsAfter.totalInjured,
    delta: toDelta(totalsAfter.totalInjured, totalsBefore.totalInjured),
  },
  {
    label: 'פצועים קשה + הרוגים',
    value: toSevereOrKilled(totalsAfter),
    delta: toDelta(toSevereOrKilled(totalsAfter), toSevereOrKilled(totalsBefore)),
  },
]

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
        {/* The cards are read one after another rather than scanned across, so
            they stay in a measured column instead of stretching to the width of
            the tables above. */}
        <div className="mx-auto max-w-[560px]">
          <div className="mb-3 rounded-lg border border-gray-200 p-4">
            <Typography
              variant="table-header"
              className="mb-3 border-b border-gray-200 pb-3 text-center text-gray-700"
            >
              מבט על · סה״כ נפגעים מכל הסוגים
            </Typography>
            <dl className="grid grid-cols-2 gap-3">
              {OVERVIEW.map((item) => (
                <div key={item.label} className="text-center">
                  <dt>
                    <Typography variant="table-body" as="span" className="text-gray-600">
                      {item.label}
                    </Typography>
                  </dt>
                  <dd>
                    {/* Proportional figures, not tabular. Nothing here lines up
                        into a column, and Moses Text's tabular set gives the
                        thousands comma a full digit advance, which opens 6,260
                        into "6 , 260". */}
                    <span className="my-2 block font-text text-[32px] leading-none font-extrabold text-gray-800">
                      {formatCount(item.value)}
                    </span>
                    <TrendPill delta={item.delta} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Fenced by a heavy edge on the side the text starts from as well as
              tinted, so it reads as set apart from the cards even where the tint
              does not survive. border-s, not border-r, so it stays on the
              reading edge. */}
          <div className="mb-5 rounded-lg border border-gray-200 border-s-4 border-s-trend-up bg-trend-up-surface/50 p-4">
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

          <Typography variant="table-header" className="mb-3 text-gray-700">
            פילוח לפי אמצעי תחבורה
          </Typography>

          <ul className="flex flex-col gap-3">
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
