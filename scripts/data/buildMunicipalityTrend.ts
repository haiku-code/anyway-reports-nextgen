import type { MunicipalityComparison } from '../../src/types'
import { assertEqual, fail } from './lib/assert'
import { readRows, type Row } from './lib/csv'
import { emitModule, serialise, type EmittedModule } from './lib/emit'
import { dataPath, sourcePath } from './lib/paths'

const EXPECTED_COLUMNS = 4

type Direction = {
  name: 'worsening' | 'improving'
  nameColumn: number
  valueColumn: number
  isExpectedSign: (value: number) => boolean
}

const DIRECTIONS: Direction[] = [
  { name: 'worsening', nameColumn: 0, valueColumn: 1, isExpectedSign: (value) => value > 0 },
  { name: 'improving', nameColumn: 2, valueColumn: 3, isExpectedSign: (value) => value < 0 },
]

function readColumn(rows: Row[], direction: Direction): MunicipalityComparison[] {
  const entries: MunicipalityComparison[] = []

  for (const row of rows) {
    const cityName = row[direction.nameColumn].trim()
    if (cityName === '') continue

    const percentChange = row[direction.valueColumn].trim()
    const value = Number(percentChange)

    if (percentChange === '' || !Number.isFinite(value)) {
      fail(`municipality-trend.csv: ${cityName} has no numeric change`)
    }
    if (!direction.isExpectedSign(value)) {
      fail(
        `municipality-trend.csv: ${cityName} is listed under ${direction.name} ` +
          `with a change of ${percentChange}`
      )
    }

    entries.push({ cityName, percentChange })
  }

  return entries
}

export async function buildMunicipalityTrend(): Promise<EmittedModule> {
  const rows = readRows(sourcePath('municipality-trend.csv'))
  assertEqual(rows[2].length, EXPECTED_COLUMNS, 'municipality-trend.csv header')

  const data = rows.slice(3)
  const [worsening, improving] = DIRECTIONS.map((direction) => readColumn(data, direction))

  if (worsening.length === 0 || improving.length === 0) {
    fail('municipality-trend.csv: one of the two columns is empty')
  }

  const names = [...worsening, ...improving].map((entry) => entry.cityName)
  if (new Set(names).size !== names.length) {
    fail('municipality-trend.csv: a municipality appears in both columns')
  }

  const body = [
    `export const MUNICIPALITY_WORSENING = ${serialise(worsening)} satisfies MunicipalityComparison[]`,
    `export const MUNICIPALITY_IMPROVING = ${serialise(improving)} satisfies MunicipalityComparison[]`,
  ].join('\n\n')

  return emitModule({
    outPath: dataPath('municipalityTrend.ts'),
    builder: 'scripts/data/buildMunicipalityTrend.ts',
    sources: ['data/source/2026/municipality-trend.csv'],
    imports: "import type { MunicipalityComparison } from '../types'",
    body,
  })
}
