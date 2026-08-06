// Where a SchoolSelect instance is rendered. Drives its sizing and whether it
// scrolls itself into view on mobile focus.
// Const object rather than a TS enum because tsconfig sets erasableSyntaxOnly,
// which rejects enums outright.
export const SchoolSelectVariant = {
  Page: 'page',
  Sticky: 'sticky',
} as const

export type SchoolSelectVariant = (typeof SchoolSelectVariant)[keyof typeof SchoolSelectVariant]

// One row of the school search. `label` is what gets matched against, so typing
// a town name finds every institution in it; `name` and `city` are what the
// result row shows in its two columns.
export type Suggestion = {
  id: number
  name: string
  city: string
  label: string
}

// A slice of text returned by autosuggest-highlight's parse()
export type ParsePart = {
  text: string
  highlight: boolean
}

export type School = {
  school_id: number
  school_name: string
  yishuv_name: string
  latitude: number
  longitude: number
}

export type InjuredYearRecord = {
  accident_year: number | string
  light_injured_count?: number | string
  severly_injured_count?: number | string
  killed_count?: number | string
}

export type MonthlyRecord = {
  accident_month_hebrew: string
  count_1: number
}

export type SexRecord = {
  sex_hebrew: string
  count_1: number
}

// Fill of one segment of the gender bar, plus the label color that stays
// readable on it. Values live in constants/genderSplit.ts.
export type GenderTone = {
  fill: string
  text: string
}

// One segment of the gender bar. `share` is the exact percentage and drives the
// segment width; `percent` is the rounded one that gets printed, and a set of
// slices always prints to exactly 100.
export type GenderSlice = {
  name: string
  count: number
  share: number
  percent: number
  tone: GenderTone
}

// Municipality comparison data
export type MunicipalityComparison = {
  cityName: string
  percentChange: number
  totalAccidents: number
  trend: 'improvement' | 'worsening'
}

// The four ways a child gets to school that the PDF report counts separately.
// The id is what picks the card's icon; the Hebrew name lives with the data.
// Const object rather than a TS enum for the erasableSyntaxOnly reason above.
export const TransportMode = {
  EScooter: 'e-scooter',
  Pedestrian: 'pedestrian',
  EBike: 'e-bike',
  Bike: 'bike',
} as const

export type TransportMode = (typeof TransportMode)[keyof typeof TransportMode]

// One period's casualties for one transport mode. `totalInjured` is the sum of
// the three severities and is carried rather than derived, because it is a
// figure printed in the source PDF.
export type CasualtyCounts = {
  totalInjured: number
  lightInjuries: number
  severeInjuries: number
  deaths: number
}

// Transportation mode statistics
export type TransportationModeStats = {
  id: TransportMode
  mode: string
  period2015_2020: CasualtyCounts
  period2020_2025: CasualtyCounts
}

// Which way a count moved between the two periods. Flat exists so a pair of
// equal counts never has to pick an arrow; no row in today's data hits it.
export const TrendDirection = {
  Up: 'up',
  Down: 'down',
  Flat: 'flat',
} as const

export type TrendDirection = (typeof TrendDirection)[keyof typeof TrendDirection]

// A change between the two periods, ready to print. `percent` is already
// formatted and signed ("+450.9%"), because the rounding rule that drops a
// trailing .0 belongs in one place rather than at every call site.
export type CasualtyDelta = {
  direction: TrendDirection
  percent: string
  // ירידה / עלייה. The word is what carries the meaning when color cannot.
  label: string
}

// City ranking data
export type CityRanking = {
  rank: number
  cityName: string
  compositeScore: number
  totalAccidents: number
  totalInjured: number
  lightInjuries: number
  severeInjuries: number
  deaths: number
}

// Educational cluster data
export type EducationalCluster = {
  clusterName: string
  cityName: string
  totalInstitutions: number
  totalInjured: number
  severeInjuries: number
  deaths: number
}
