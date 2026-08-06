import { TrendDirection, type CasualtyCounts, type CasualtyDelta } from '../types'

// Every figure in this section counts injured or killed people, so more is
// always the bad direction. These two words are what the reader actually reads;
// the color and the arrow only repeat them.
const TREND_LABELS: Record<TrendDirection, string> = {
  [TrendDirection.Up]: 'עלייה',
  [TrendDirection.Down]: 'ירידה',
  [TrendDirection.Flat]: 'ללא שינוי',
}

// One decimal, and drop it when it is zero, so a clean 50% does not print as
// "50.0%" beside a 450.9% that needs the digit.
function formatPercent(value: number): string {
  const rounded = Math.round(Math.abs(value) * 10) / 10
  const digits = Number.isInteger(rounded) ? 0 : 1
  return `${rounded.toFixed(digits)}%`
}

// Change from one period to the next. The sign leads the number rather than
// trailing it, which is the convention Hebrew shares with everyone else, and
// the whole string is rendered dir="ltr" so bidi cannot move it.
export function toDelta(current: number, previous: number): CasualtyDelta {
  // No previous casualties means there is no percentage to state: any rise off
  // zero is infinite. Nothing in today's data reaches this, but a future
  // transcription could.
  if (previous === 0) {
    const direction = current === 0 ? TrendDirection.Flat : TrendDirection.Up
    return { direction, percent: '', label: TREND_LABELS[direction] }
  }

  const change = ((current - previous) / previous) * 100
  const direction =
    change > 0 ? TrendDirection.Up : change < 0 ? TrendDirection.Down : TrendDirection.Flat
  const sign = direction === TrendDirection.Up ? '+' : direction === TrendDirection.Down ? '-' : ''

  return {
    direction,
    percent: `${sign}${formatPercent(change)}`,
    label: TREND_LABELS[direction],
  }
}

// The two figures the overview card leads with. Severe injuries and deaths are
// added together because separately they are small enough to read as noise,
// and together they are the count that says whether crashes got worse rather
// than merely fewer.
export function toSevereOrKilled(counts: CasualtyCounts): number {
  return counts.severeInjuries + counts.deaths
}

export function formatCount(value: number): string {
  return value.toLocaleString('he-IL')
}
