import React, { useMemo } from 'react'
import { GENDER_INLINE_LABEL_MIN_PERCENT } from '../constants/genderSplit'
import { toGenderSlices } from '../lib/genderSplit'
import { cn } from '../lib/utils'
import type { SexRecord } from '../types'

type Props = {
  stats: SexRecord[] | null
  className?: string
}

// The gender split is close to 50/50 for most schools, so a pie spent 250px of
// the sidebar to say "two halves". One horizontal bar says the same in 24px and
// makes the deviation from half easier to compare between schools, since the
// segments always start from the same edge.
//
// Every number appears once: the bar carries the share, the legend under it
// carries the head count. Percentages matter little on their own here, because
// some schools have only a handful of injured children and 75% of eight is six
// people, so the count is what keeps the share honest.
export const GenderSplitBar: React.FC<Props> = ({ stats, className }) => {
  const slices = useMemo(() => toGenderSlices(stats), [stats])

  if (slices.length === 0) return null

  const summary = slices
    .map((slice) => `${slice.name} ${slice.percent}% (${slice.count})`)
    .join(', ')

  return (
    <div className={cn('w-full', className)}>
      {/* The 2px gap is what separates the segments. A stroke around them would
          add ink that is not data, and both fills clear 3:1 against the card on
          their own, so nothing needs outlining. Flex shrinks the two widths to
          absorb the gap in proportion, which costs about 1px of a 300px bar. */}
      <div role="img" aria-label={`נפגעים לפי מין: ${summary}`} className="flex h-6 w-full gap-0.5">
        {slices.map((slice, index) => (
          <div
            key={slice.name}
            // Width is the exact share, not the rounded one, so the bar stays
            // truthful even where the printed percentages are nudged to 100.
            style={{
              width: `${slice.share}%`,
              backgroundColor: slice.tone.fill,
              color: slice.tone.text,
            }}
            className={cn(
              'flex items-center justify-center overflow-hidden transition-[width] duration-700 ease-out motion-reduce:transition-none',
              // Only the outer ends of the whole bar are rounded; the edges that
              // face the gap stay square, so the split reads as one bar cut.
              index === 0 && 'rounded-s-full',
              index === slices.length - 1 && 'rounded-e-full'
            )}
          >
            {slice.percent >= GENDER_INLINE_LABEL_MIN_PERCENT && (
              <span className="font-text text-sm font-semibold">{slice.percent}%</span>
            )}
          </div>
        ))}
      </div>

      {/* Spread rather than packed, so each entry sits under the side of the bar
          its own segment occupies and position reinforces the color.
          Moses Text throughout: these are metadata labels sitting inline with
          figures, the same treatment the city name gets in SchoolSelect, and
          Moses Display stays with the section heading above. */}
      <ul className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-text text-[13px]">
        {slices.map((slice) => (
          <li key={slice.name} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: slice.tone.fill }}
            />
            <span className="text-ink/70">{slice.name}</span>
            {/* Only the segments too narrow to hold their own percentage repeat
                it here, so the common case never prints the same number twice. */}
            {slice.percent < GENDER_INLINE_LABEL_MIN_PERCENT && (
              <span className="font-semibold text-ink">{slice.percent}%</span>
            )}
            <span aria-hidden="true" className="text-ink/30">
              ·
            </span>
            <span className="font-semibold text-ink">{slice.count.toLocaleString('he-IL')}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
