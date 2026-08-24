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
