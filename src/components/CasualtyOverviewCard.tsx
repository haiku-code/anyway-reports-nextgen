import React from 'react'
import { TRANSPORTATION_TOTALS } from '../constants/transportationStats'
import { formatCount, toDelta, toSevereOrKilled } from '../lib/transportationTrend'
import { cn } from '../lib/utils'
import TrendPill from './TrendPill'
import Typography from './Typography'

const { period2015_2020: totalsBefore, period2020_2025: totalsAfter } = TRANSPORTATION_TOTALS

// The two figures this card opens on. Total casualties fell, yet the count of
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

type Props = {
  className?: string
}

// Its own component because it renders in two places at two widths: up in the
// article on narrow screens, and at the head of the transport breakdown on wide
// ones. Only one is ever displayed. The caller passes the visibility, so this
// file does not have to know which of the two placements it is.
export const CasualtyOverviewCard: React.FC<Props> = ({ className }) => (
  <div className={cn('rounded-lg border border-gray-200 p-4', className)}>
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
            {/* Proportional figures, not tabular. Nothing here lines up into a
                column, and Moses Text's tabular set gives the thousands comma a
                full digit advance, which opens 6,260 into "6 , 260". */}
            <span className="my-2 block font-text text-[32px] leading-none font-extrabold text-gray-800">
              {formatCount(item.value)}
            </span>
            <TrendPill delta={item.delta} />
          </dd>
        </div>
      ))}
    </dl>
  </div>
)

export default CasualtyOverviewCard
