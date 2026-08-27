import { type CasualtyCounts } from '../types'

// The three severities every card breaks its total into, worst first so the
// eye meets the deaths before the sprains. `short` is the same column inside
// the previous-period line, where the full names would wrap the row.
//
// Presentation rather than data, which is why this is the one thing left in
// this file: the counts and the periods are generated into src/data/.
export const CASUALTY_SEVERITIES: {
  key: keyof CasualtyCounts
  label: string
  short: string
}[] = [
  { key: 'deaths', label: 'הרוגים', short: 'הרוגים' },
  { key: 'severeInjuries', label: 'פצועים קשה', short: 'קשה' },
  { key: 'lightInjuries', label: 'פצועים קל', short: 'קל' },
]
