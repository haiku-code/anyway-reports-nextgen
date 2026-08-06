import React from 'react'
import { CASUALTY_SEVERITIES, TRANSPORTATION_PERIODS } from '../constants/transportationStats'
import { formatCount, toDelta } from '../lib/transportationTrend'
import { cn } from '../lib/utils'
import type { TransportationModeStats } from '../types'
import TransportIcon from './TransportIcon'
import TrendPill, { TrendPillSize } from './TrendPill'
import Typography from './Typography'

type Props = {
  stats: TransportationModeStats
  expanded: boolean
  onToggle: () => void
}

// Expanded and collapsed are the same card: the previous period's raw counts
// are the only thing the disclosure hides. Everything that makes the mode
// comparable to its neighbours, including every percentage, stays on screen
// closed, so a reader who never opens one still gets the whole finding.
export const TransportationModeCard: React.FC<Props> = ({ stats, expanded, onToggle }) => {
  const { period2015_2020: before, period2020_2025: after } = stats
  const totalDelta = toDelta(after.totalInjured, before.totalInjured)
  const panelId = `transport-${stats.id}-previous`

  return (
    <li className="rounded-lg border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
            <TransportIcon mode={stats.id} />
          </span>
          <Typography variant="table-header" as="span" className="text-gray-800">
            {stats.mode}
          </Typography>
        </div>
        <TrendPill delta={totalDelta} />
      </div>

      <Typography variant="table-body" as="p" className="mb-3 text-gray-600">
        סה״כ נפגעים:{' '}
        <strong className="font-bold text-gray-800">{formatCount(after.totalInjured)}</strong>{' '}
        <span className="text-gray-500">
          לעומת <span>{formatCount(before.totalInjured)}</span> בתקופה הקודמת
        </span>
      </Typography>

      <dl className="grid grid-cols-3 gap-2">
        {CASUALTY_SEVERITIES.map(({ key, label }) => (
          <div key={key} className="rounded-lg bg-gray-50 px-1.5 py-3 text-center">
            <dt>
              <Typography variant="table-body" as="span" className="text-gray-600">
                {label}
              </Typography>
            </dt>
            <dd>
              <span className="my-1.5 block font-text text-[20px] leading-none font-extrabold text-gray-800">
                {formatCount(after[key])}
              </span>
              <TrendPill delta={toDelta(after[key], before[key])} size={TrendPillSize.Compact} />
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 border-t border-gray-200 pt-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg py-1 text-gray-700 transition-colors hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
        >
          <Typography variant="table-body" as="span" className="font-semibold text-inherit">
            השוואה לתקופה קודמת<span className="sr-only"> עבור {stats.mode}</span>
          </Typography>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={cn(
              'size-4 transition-transform duration-200 motion-reduce:transition-none',
              expanded && 'rotate-180'
            )}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {/* A grid row going 0fr to 1fr is what makes this animate: height alone
            cannot transition to a content-sized value, and the alternatives are
            measuring the panel in JS or capping it with a max-height guess that
            breaks the moment the row wraps on a narrow screen.

            The panel stays mounted so there is something to animate, so it is
            marked inert while closed. Otherwise the clipped text would still be
            reachable by keyboard and read out by a screen reader as though the
            card were open. */}
        <div
          id={panelId}
          inert={!expanded}
          className={cn(
            'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
            expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          )}
        >
          <div className="overflow-hidden">
            {/* The top margin lives in here rather than on the grid, so it is
                clipped along with the panel and the closed card keeps its
                spacing exactly as it was before. */}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg bg-gray-50 px-3 py-2">
              <Typography
                variant="table-body"
                as="span"
                dir="ltr"
                className="font-semibold text-gray-500"
              >
                {TRANSPORTATION_PERIODS.previous}
              </Typography>
              <Typography variant="table-body" as="span" className="text-gray-600">
                {CASUALTY_SEVERITIES.map(({ key, short }, index) => (
                  <React.Fragment key={key}>
                    {index > 0 && <span className="mx-1 text-gray-300">·</span>}
                    <span>{formatCount(before[key])}</span> {short}
                  </React.Fragment>
                ))}
              </Typography>
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}

export default TransportationModeCard
