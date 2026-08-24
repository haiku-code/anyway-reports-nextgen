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

// How far the "find an institution near me" request has got. Every state except
// Idle and Ready has a line of copy in lib/geoStatus.ts; Ready says nothing
// because the panel of nearby institutions is the answer.
// Const object rather than a TS enum for the erasableSyntaxOnly reason above.
export const GeolocationStatus = {
  Idle: 'idle',
  Locating: 'locating',
  Ready: 'ready',
  Denied: 'denied',
  Unavailable: 'unavailable',
  Error: 'error',
} as const

export type GeolocationStatus = (typeof GeolocationStatus)[keyof typeof GeolocationStatus]

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

// The two windows the whole report compares, both read from the exports rather
// than written here. Shared by the transport section and the cities table, so
// the caption above one cannot drift from the caption above the other.
// Rendered inside dir="ltr" wherever it prints, so bidi cannot reorder it.
export type ReportPeriods = {
  previous: string
  current: string
}

// One row of the worsening or improving column. percentChange is the text the
// export printed, not a number, because the source publishes one decimal in one
// column and none in the other and prints 69.0 rather than 69. Rendering a
// parsed number would silently drop that digit.
//
// There is no trend field: which of the two arrays a row is in already says
// which direction it moved, and the sign is asserted when the file is built.
export type MunicipalityComparison = {
  cityName: string
  percentChange: string
}

// The five ways a child gets to school that the report counts separately.
// The id is what picks the card's icon; the Hebrew name lives with the data.
// Const object rather than a TS enum for the erasableSyntaxOnly reason above.
//
// Scooter is the unpowered kick scooter, counted apart from the electric one
// from the 2026 edition on. TransportIcon keys a Record on this type, so a
// mode added here will not compile until it has an icon.
export const TransportMode = {
  EScooter: 'e-scooter',
  Pedestrian: 'pedestrian',
  EBike: 'e-bike',
  Bike: 'bike',
  Scooter: 'scooter',
} as const

export type TransportMode = (typeof TransportMode)[keyof typeof TransportMode]

// One period's casualties for one transport mode. `totalInjured` is the sum of
// the three severities and is carried rather than derived, because it is a
// figure the export prints in its own row. The builder asserts the two agree.
export type CasualtyCounts = {
  totalInjured: number
  lightInjuries: number
  severeInjuries: number
  deaths: number
}

// The printed change for each figure a mode card shows, keyed to mirror
// CasualtyCounts so a card can read changes[key] beside currentPeriod[key] in
// the same loop. Record rather than four written out fields, so adding a
// severity to CasualtyCounts fails to compile until every mode carries its
// change too.
export type CasualtyChanges = Record<keyof CasualtyCounts, string>

// Transportation mode statistics
// Period keys are deliberately generic. They named their year ranges until the
// 2026 edition, which meant renaming a field in six files every time the report
// moved on a year; now only the values in REPORT_PERIODS change.
//
// changes carries the percentage the source printed rather than one derived at
// render time. The exports print 463% where recomputing gives 462.5%, and the
// published page follows the source. scripts/data/verify.ts recomputes all of
// them from the counts and fails the build on a disagreement.
export type TransportationModeStats = {
  id: TransportMode
  mode: string
  previousPeriod: CasualtyCounts
  currentPeriod: CasualtyCounts
  changes: CasualtyChanges
}

// One of the two figures the overview card leads with. The overview export
// describes that card completely: both labels, both counts and both changes,
// so all three come from it rather than being split across the file and the
// component.
export type SummaryFigure = {
  label: string
  value: number
  change: string
}

// Which way a count moved between the two periods. Flat exists so a pair of
// equal counts never has to pick an arrow; no row in today's data hits it.
export const TrendDirection = {
  Up: 'up',
  Down: 'down',
  Flat: 'flat',
} as const

export type TrendDirection = (typeof TrendDirection)[keyof typeof TrendDirection]

// A change between the two periods, ready to print. `percent` is the string the
// export published, carried through the data pipeline and signed ("+463%"),
// so nothing in the app rounds it and the page cannot disagree with the source.
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
