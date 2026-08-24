import { TrendDirection, type CasualtyDelta } from '../types'

// Every figure in this section counts injured or killed people, so more is
// always the bad direction. These two words are what the reader actually reads;
// the color and the arrow only repeat them.
const TREND_LABELS: Record<TrendDirection, string> = {
  [TrendDirection.Up]: 'עלייה',
  [TrendDirection.Down]: 'ירידה',
  [TrendDirection.Flat]: 'ללא שינוי',
}

// The percentage arrives already formatted, carried from the export by the data
// pipeline, so there is no rounding here and no way for the page to disagree
// with the source. All this adds is the direction and the word, which the pill
// needs and a string does not carry.
export function toDelta(percent: string): CasualtyDelta {
  const value = Number(percent.replace('%', ''))
  const direction =
    value > 0 ? TrendDirection.Up : value < 0 ? TrendDirection.Down : TrendDirection.Flat

  return { direction, percent, label: TREND_LABELS[direction] }
}

export function formatCount(value: number): string {
  return value.toLocaleString('he-IL')
}
