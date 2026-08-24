import { TOP_CITIES } from '../data/topCities'
import { type CityRanking } from '../types'

// The head of the ranked table cut by a different measure: raw casualties
// rather than the composite score the table ranks by. The search's empty state
// offers these as shortcuts, and a list that prints counts has to be ordered by
// the counts it prints, or it reads as a bug. Both cuts come from the same
// published rows.
export const mostInjuredCities: CityRanking[] = [...TOP_CITIES]
  .sort((a, b) => b.totalInjured - a.totalInjured)
  .slice(0, 6)
