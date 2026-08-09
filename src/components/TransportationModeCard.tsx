import React from 'react'
import { CASUALTY_SEVERITIES } from '../constants/transportationStats'
import { formatCount, toDelta } from '../lib/transportationTrend'
import { cn } from '../lib/utils'
import type { TransportationModeStats } from '../types'
import PreviousPeriodLine from './PreviousPeriodLine'
import TransportIcon from './TransportIcon'
import TrendPill, { TrendPillSize } from './TrendPill'
import Typography from './Typography'

type Props = {
  stats: TransportationModeStats
  expanded: boolean
  onToggle: () => void
}

// Three layouts, one card.
//
// Phone: severities across in three columns, and the previous period folded
// behind a disclosure, because height is worth more there than two taps.
// lg: two per row, previous period always shown. There is room for it, and
// hiding data behind a click costs the reader the comparison this section is
// about.
// xl: one of four panels differing only in their data, so the reader compares
// them by eye rather than by memory. That only works if the rows line up across
// all four, which is what the fixed header height, the stacked severities and
// the bottom-pinned previous-period row are for.
export const TransportationModeCard: React.FC<Props> = ({ stats, expanded, onToggle }) => {
  const { period2015_2020: before, period2020_2025: after } = stats
  const totalDelta = toDelta(after.totalInjured, before.totalInjured)
  const panelId = `transport-${stats.id}-previous`

  return (
    <li className="flex flex-col rounded-lg border border-gray-200 p-4">
      {/* Beside the name while there is width for it; stacked under it in the
          four-across layout, where the pill and the longest mode name cannot
          share a line. min-h holds the two-line names level with the one-line
          ones so the rows beneath start at the same height in every card. */}
      <div className="mb-3 flex items-center justify-between gap-3 xl:mb-4 xl:min-h-[76px] xl:flex-col xl:items-start xl:gap-2">
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

      {/* One sentence on a phone. Broken onto two lines in the narrow column,
          where it would otherwise wrap at a different word in every card and
          knock the severity rows out of alignment. */}
      <Typography variant="table-body" as="p" className="mb-3 text-gray-600">
        <span className="xl:block">
          סה״כ נפגעים:{' '}
          <strong className="font-bold text-gray-800">{formatCount(after.totalInjured)}</strong>
        </span>{' '}
        <span className="text-gray-500 xl:block">
          לעומת {formatCount(before.totalInjured)} בתקופה הקודמת
        </span>
      </Typography>

      {/* Three across on a phone, one per row in the column, where stacking is
          what puts הרוגים at the same height in all four cards and turns the
          row of panels into something a reader can scan across. */}
      <dl className="grid grid-cols-3 gap-2 xl:grid-cols-1">
        {CASUALTY_SEVERITIES.map(({ key, label }) => (
          <div
            key={key}
            className="rounded-lg bg-gray-50 px-1.5 py-3 text-center xl:flex xl:items-center xl:justify-between xl:px-3 xl:py-2 xl:text-start"
          >
            <dt>
              <Typography variant="table-body" as="span" className="text-gray-600">
                {label}
              </Typography>
            </dt>
            <dd className="xl:flex xl:items-center xl:gap-2">
              <span className="my-1.5 block font-text text-[20px] leading-none font-extrabold text-gray-800 xl:my-0 xl:inline-block">
                {formatCount(after[key])}
              </span>
              <TrendPill delta={toDelta(after[key], before[key])} size={TrendPillSize.Compact} />
            </dd>
          </div>
        ))}
      </dl>

      {/* Phone only. */}
      <div className="mt-3 border-t border-gray-200 pt-3 lg:hidden">
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
            <PreviousPeriodLine counts={before} className="mt-2" />
          </div>
        </div>
      </div>

      {/* Desktop only, and pinned to the bottom of the card: the four cards are
          stretched to a common height, so without mt-auto a shorter one would
          leave this row floating mid-card and break the line it shares with its
          neighbours. */}
      <div className="mt-3 hidden border-t border-gray-200 pt-3 lg:mt-auto lg:block">
        <PreviousPeriodLine counts={before} />
      </div>
    </li>
  )
}

export default TransportationModeCard
