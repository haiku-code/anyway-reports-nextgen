import React from 'react'
import { TrendDirection, type CasualtyDelta } from '../types'
import { cn } from '../lib/utils'
import TrendArrow from './TrendArrow'

export const TrendPillSize = {
  // Tinted pill with the direction spelled out. For the figure a card leads on.
  Full: 'full',
  // Bare colored text under a severity count, where three of them sit in a row
  // and three tinted pills would out-shout the numbers they belong to.
  Compact: 'compact',
} as const

export type TrendPillSize = (typeof TrendPillSize)[keyof typeof TrendPillSize]

type Props = {
  delta: CasualtyDelta
  size?: TrendPillSize
  className?: string
}

const TONE: Record<TrendDirection, { text: string; surface: string }> = {
  [TrendDirection.Up]: { text: 'text-trend-up', surface: 'bg-trend-up-surface' },
  [TrendDirection.Down]: { text: 'text-trend-down', surface: 'bg-trend-down-surface' },
  [TrendDirection.Flat]: { text: 'text-gray-600', surface: 'bg-gray-100' },
}

// Three redundant encodings of the same fact, on purpose: an arrow, a word or a
// sign, and a color. Color alone would put the whole section's meaning behind
// normal color vision and behind the report ever being printed in grayscale.
export const TrendPill: React.FC<Props> = ({ delta, size = TrendPillSize.Full, className }) => {
  const tone = TONE[delta.direction]
  const isFull = size === TrendPillSize.Full

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-text font-bold whitespace-nowrap',
        tone.text,
        isFull ? cn('rounded-full px-2.5 py-1 text-[13px]', tone.surface) : 'text-[11.5px]',
        className
      )}
    >
      <TrendArrow direction={delta.direction} className={isFull ? 'size-[15px]' : 'size-[13px]'} />
      {isFull && <span className="font-extrabold">{delta.label}</span>}
      {/* The sign has to lead the digits, and in an RTL paragraph only an
          explicit ltr run keeps it there. */}
      {delta.percent && <span dir="ltr">{delta.percent}</span>}
    </span>
  )
}

export default TrendPill
