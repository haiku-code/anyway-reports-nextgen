import React from 'react'
import { TrendDirection } from '../types'
import { cn } from '../lib/utils'

type Props = {
  direction: TrendDirection
  className?: string
}

// Diagonals, as the concept drew them: the arrow reads as a slope rather than
// as a pointer to something on the page, which a plain vertical arrow beside a
// number tends to. It keeps pointing right in this RTL layout because the
// horizontal leg is not saying "later", it is only holding the slope up.
const PATHS: Record<TrendDirection, string> = {
  [TrendDirection.Up]: 'M7 17 17 7m-8 0h8v8',
  [TrendDirection.Down]: 'm7 7 10 10m0-8v8H9',
  [TrendDirection.Flat]: 'M6 12h12m-4-4 4 4-4 4',
}

// Decorative everywhere it renders: the pill spells out ירידה or עלייה next to
// it, and the compact cells print a signed percentage.
export const TrendArrow: React.FC<Props> = ({ direction, className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.4}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={cn('shrink-0', className)}
  >
    <path d={PATHS[direction]} />
  </svg>
)

export default TrendArrow
