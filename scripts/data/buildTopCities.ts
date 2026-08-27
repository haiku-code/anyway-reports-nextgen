import type { CityRanking } from '../../src/types'
import { assertEqual, assertSum, fail } from './lib/assert'
import { parseCount, readRows } from './lib/csv'
import { emitModule, serialise, type EmittedModule } from './lib/emit'
import { dataPath, sourcePath } from './lib/paths'

const EXPECTED_COLUMNS = 8
const EXPECTED_ROWS = 20

export async function buildTopCities(): Promise<EmittedModule> {
  const rows = readRows(sourcePath('top-cities.csv'))
  const data = rows.slice(2)

  assertEqual(rows[1].length, EXPECTED_COLUMNS, 'top-cities.csv header')
  assertEqual(data.length, EXPECTED_ROWS, 'top-cities.csv row count')

  const cities: CityRanking[] = data.map((row, index) => {
    assertEqual(row.length, EXPECTED_COLUMNS, `top-cities.csv row ${index + 1}`)

    const rank = parseCount(row[0])
    if (rank !== index + 1) {
      fail(`top-cities.csv: rank ${rank} in position ${index + 1}, ranks must run 1 to 20 in order`)
    }

    const cityName = row[1].trim()
    if (cityName === '') fail(`top-cities.csv: empty city name at rank ${rank}`)

    const deaths = parseCount(row[2])
    const severeInjuries = parseCount(row[3])
    const lightInjuries = parseCount(row[4])
    const totalInjured = parseCount(row[5])

    assertSum([deaths, severeInjuries, lightInjuries], totalInjured, `${cityName}, severities`)

    return {
      rank,
      cityName,
      compositeScore: parseCount(row[7]),
      totalAccidents: parseCount(row[6]),
      totalInjured,
      lightInjuries,
      severeInjuries,
      deaths,
    }
  })

  // The table is ranked by the weighted score, so a score that rises as the
  // rank falls means the export was sorted by something else.
  for (let index = 1; index < cities.length; index += 1) {
    if (cities[index].compositeScore > cities[index - 1].compositeScore) {
      fail(
        `top-cities.csv: ${cities[index].cityName} scores higher than ` +
          `${cities[index - 1].cityName} but is ranked below it`
      )
    }
  }

  return emitModule({
    outPath: dataPath('topCities.ts'),
    builder: 'scripts/data/buildTopCities.ts',
    sources: ['data/source/2026/top-cities.csv'],
    imports: "import type { CityRanking } from '../types'",
    body: `export const TOP_CITIES = ${serialise(cities)} satisfies CityRanking[]`,
  })
}
