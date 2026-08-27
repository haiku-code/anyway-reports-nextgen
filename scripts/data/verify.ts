import type { CasualtyCounts } from '../../src/types'
import { assertSum, fail } from './lib/assert'
import { parseYearRange } from './lib/csv'
import { percentChange, precisionOf, roundHalfUp } from './lib/percent'

const SEVERITIES: (keyof CasualtyCounts)[] = ['deaths', 'severeInjuries', 'lightInjuries']

// The check the whole carried-percentage decision rests on. The page prints
// what the export printed, so nothing else would notice an export whose
// percentage disagrees with its own counts. Compared at the precision the
// carried string shows, because the overview export prints two decimals beside
// none on the same row.
function checkChange(current: number, previous: number, printed: string, context: string): void {
  const computed = roundHalfUp(percentChange(current, previous), precisionOf(printed))
  const stated = Number(printed.replace('%', ''))

  if (computed !== stated) {
    fail(`${context}: counts give ${computed}%, the source printed ${printed}`)
  }
}

// The five generated modules are loaded here rather than imported at the top of
// the file, and that is the whole point of this function. A static import is
// evaluated when the module graph loads, which is before build.ts has written
// anything, so a statically imported verifier checks the previous run's files:
// a bad export would pass the run that generated it and only fail the next one.
// Loading them after the writes is what makes this a check on what was just
// emitted. The specifiers stay literal so TypeScript still types them.
async function loadGenerated() {
  const [municipalityTrend, periods, summary, topCities, transportation] = await Promise.all([
    import('../../src/data/municipalityTrend'),
    import('../../src/data/periods'),
    import('../../src/data/summary'),
    import('../../src/data/topCities'),
    import('../../src/data/transportation'),
  ])

  return {
    MUNICIPALITY_IMPROVING: municipalityTrend.MUNICIPALITY_IMPROVING,
    MUNICIPALITY_WORSENING: municipalityTrend.MUNICIPALITY_WORSENING,
    REPORT_PERIODS: periods.REPORT_PERIODS,
    REPORT_SUMMARY: summary.REPORT_SUMMARY,
    TOP_CITIES: topCities.TOP_CITIES,
    TRANSPORTATION_MODES: transportation.TRANSPORTATION_MODES,
  }
}

export async function verify(): Promise<void> {
  const {
    MUNICIPALITY_IMPROVING,
    MUNICIPALITY_WORSENING,
    REPORT_PERIODS,
    REPORT_SUMMARY,
    TOP_CITIES,
    TRANSPORTATION_MODES,
  } = await loadGenerated()

  const sumOf = (
    pick: (counts: CasualtyCounts) => number,
    period: 'previousPeriod' | 'currentPeriod'
  ) => TRANSPORTATION_MODES.reduce((running, mode) => running + pick(mode[period]), 0)

  // 1. Every mode's severities add up to its printed total, in both periods,
  //    and every carried percentage matches its counts.
  for (const mode of TRANSPORTATION_MODES) {
    for (const period of ['previousPeriod', 'currentPeriod'] as const) {
      const counts = mode[period]
      assertSum(
        SEVERITIES.map((key) => counts[key]),
        counts.totalInjured,
        `${mode.mode}, ${period}`
      )
    }

    for (const key of ['totalInjured', ...SEVERITIES] as (keyof CasualtyCounts)[]) {
      checkChange(
        mode.currentPeriod[key],
        mode.previousPeriod[key],
        mode.changes[key],
        `${mode.mode}, ${key}`
      )
    }
  }

  // 2. The five modes add up to the overview export, and the previous period
  //    total, which is printed nowhere, reproduces both of its percentages.
  const currentTotal = sumOf((counts) => counts.totalInjured, 'currentPeriod')
  const previousTotal = sumOf((counts) => counts.totalInjured, 'previousPeriod')
  const currentSevere =
    sumOf((counts) => counts.severeInjuries, 'currentPeriod') +
    sumOf((counts) => counts.deaths, 'currentPeriod')
  const previousSevere =
    sumOf((counts) => counts.severeInjuries, 'previousPeriod') +
    sumOf((counts) => counts.deaths, 'previousPeriod')

  const [total, severeOrKilled] = REPORT_SUMMARY
  if (total.value !== currentTotal) {
    fail(`the five modes total ${currentTotal}, the overview prints ${total.value}`)
  }
  if (severeOrKilled.value !== currentSevere) {
    fail(
      `the five modes give ${currentSevere} severe or killed, ` +
        `the overview prints ${severeOrKilled.value}`
    )
  }

  checkChange(currentTotal, previousTotal, total.change, 'overview, total injured')
  checkChange(currentSevere, previousSevere, severeOrKilled.change, 'overview, severe or killed')

  // 3. The ranked table.
  if (TOP_CITIES.length !== 20) fail(`expected 20 ranked cities, found ${TOP_CITIES.length}`)
  TOP_CITIES.forEach((city, index) => {
    if (city.rank !== index + 1) fail(`rank ${city.rank} sits in position ${index + 1}`)
    assertSum(
      [city.deaths, city.severeInjuries, city.lightInjuries],
      city.totalInjured,
      `${city.cityName}, severities`
    )
  })

  // 4. The trend lists cover the ranked table exactly. Nothing in either export
  //    states this, and it is the strongest cross check the four files allow.
  const ranked = new Set(TOP_CITIES.map((city) => city.cityName))
  const listed = [...MUNICIPALITY_WORSENING, ...MUNICIPALITY_IMPROVING].map(
    (entry) => entry.cityName
  )

  if (new Set(listed).size !== listed.length) {
    fail('a municipality is listed twice in the trend table')
  }
  if (listed.length !== ranked.size) {
    fail(
      `the trend table lists ${listed.length} municipalities, ` +
        `the ranked table has ${ranked.size}`
    )
  }
  for (const name of listed) {
    if (!ranked.has(name)) fail(`${name} is in the trend table but not in the ranked table`)
  }

  // 5. The two periods still describe one contiguous comparison.
  const previous = parseYearRange(REPORT_PERIODS.previous)
  const current = parseYearRange(REPORT_PERIODS.current)
  if (current.start !== previous.end) {
    fail(
      `the periods are not contiguous: ${REPORT_PERIODS.previous} then ${REPORT_PERIODS.current}`
    )
  }
  if (previous.end - previous.start !== current.end - current.start) {
    fail(
      `the periods differ in length: ${REPORT_PERIODS.previous} against ${REPORT_PERIODS.current}`
    )
  }

  console.log('verified 22 percentages, 30 severity sums and 4 cross file checks')
}
