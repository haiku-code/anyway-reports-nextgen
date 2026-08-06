import { TransportMode, type CasualtyCounts, type TransportationModeStats } from '../types'

// The three severities every card breaks its total into, worst first so the
// eye meets the deaths before the sprains. `short` is the same column inside
// the previous-period line, where the full names would wrap the row.
export const CASUALTY_SEVERITIES: {
  key: keyof CasualtyCounts
  label: string
  short: string
}[] = [
  { key: 'deaths', label: 'הרוגים', short: 'הרוגים' },
  { key: 'severeInjuries', label: 'פצועים קשה', short: 'קשה' },
  { key: 'lightInjuries', label: 'פצועים קל', short: 'קל' },
]

// The two windows the report compares. Hyphens, not en dashes, per the repo's
// rule on dashes in published copy.
export const TRANSPORTATION_PERIODS = {
  previous: '2015-2020',
  current: '2020-2025',
} as const

// Transcribed from the printed PDF report. There is no API behind this: when a
// number here is wrong, this literal is the fix.
//
// Ordered by the size of the story rather than by count. The electric scooter
// row is the finding, so it leads and opens expanded; the other three are the
// context that makes it legible. Sorting by casualties instead would bury a
// 450% rise under a category that is falling.
export const TRANSPORTATION_MODES: TransportationModeStats[] = [
  {
    id: TransportMode.EScooter,
    mode: 'קורקינט חשמלי',
    period2015_2020: { totalInjured: 114, lightInjuries: 102, severeInjuries: 10, deaths: 2 },
    period2020_2025: { totalInjured: 628, lightInjuries: 559, severeInjuries: 66, deaths: 3 },
  },
  {
    id: TransportMode.Pedestrian,
    mode: 'הולכי רגל',
    period2015_2020: { totalInjured: 4596, lightInjuries: 4257, severeInjuries: 323, deaths: 16 },
    period2020_2025: { totalInjured: 4072, lightInjuries: 3721, severeInjuries: 330, deaths: 21 },
  },
  {
    id: TransportMode.EBike,
    mode: 'אופניים חשמליים',
    period2015_2020: { totalInjured: 1058, lightInjuries: 997, severeInjuries: 56, deaths: 5 },
    period2020_2025: { totalInjured: 749, lightInjuries: 688, severeInjuries: 58, deaths: 3 },
  },
  {
    // "רגילים" rather than the PDF's bare "אופניים": this row sits next to the
    // electric one, and side by side the bare word reads as the category that
    // contains it.
    id: TransportMode.Bike,
    mode: 'אופניים רגילים',
    period2015_2020: { totalInjured: 1057, lightInjuries: 993, severeInjuries: 60, deaths: 4 },
    period2020_2025: { totalInjured: 811, lightInjuries: 758, severeInjuries: 50, deaths: 3 },
  },
]

// The PDF's own סה״כ row, kept as transcribed rather than summed from the four
// modes above. It happens to equal that sum today, and a future edit that
// breaks the equality should show up as a discrepancy to check against the
// source, not be silently papered over by a reducer.
export const TRANSPORTATION_TOTALS: {
  period2015_2020: CasualtyCounts
  period2020_2025: CasualtyCounts
} = {
  period2015_2020: { totalInjured: 6825, lightInjuries: 6349, severeInjuries: 449, deaths: 27 },
  period2020_2025: { totalInjured: 6260, lightInjuries: 5726, severeInjuries: 504, deaths: 30 },
}
