import React from 'react'
import { CASUALTY_SEVERITIES } from '../constants/transportationStats'
import { REPORT_PERIODS } from '../data/periods'
import { formatCount } from '../lib/transportationTrend'
import { cn } from '../lib/utils'
import type { CasualtyCounts } from '../types'
import Typography from './Typography'

type Props = {
  counts: CasualtyCounts
  className?: string
}

// The earlier period's figures a card compares against. Its own component because it
// renders twice: inside the mobile disclosure, and as a plain always-visible
// row on desktop, where there is room and hiding it behind a click would cost
// the reader the comparison the section exists for.
export const PreviousPeriodLine: React.FC<Props> = ({ counts, className }) => (
  <div
    className={cn(
      'flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg bg-gray-50 px-3 py-2',
      className
    )}
  >
    <Typography variant="table-body" as="span" dir="ltr" className="font-semibold text-gray-500">
      {REPORT_PERIODS.previous}
    </Typography>
    <Typography variant="table-body" as="span" className="text-gray-600">
      {CASUALTY_SEVERITIES.map(({ key, short }, index) => (
        <React.Fragment key={key}>
          {index > 0 && <span className="mx-1 text-gray-300">·</span>}
          <span>{formatCount(counts[key])}</span> {short}
        </React.Fragment>
      ))}
    </Typography>
  </div>
)

export default PreviousPeriodLine
