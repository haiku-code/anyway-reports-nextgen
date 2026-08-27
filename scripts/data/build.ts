import { writeFileSync } from 'node:fs'
import { buildMunicipalityTrend } from './buildMunicipalityTrend'
import { buildPeriods } from './buildPeriods'
import { buildSummary } from './buildSummary'
import { buildTopCities } from './buildTopCities'
import { buildTransportation } from './buildTransportation'
import { verify } from './verify'

const builders = [
  buildPeriods,
  buildTransportation,
  buildSummary,
  buildTopCities,
  buildMunicipalityTrend,
]

for (const build of builders) {
  const { outPath, source } = await build()
  writeFileSync(outPath, source, 'utf8')
  console.log(`wrote ${outPath}`)
}

// Reads what was just written rather than what was held in memory, so a bug in
// the emitter fails here too. A failure leaves the files on disk so the diff can
// be read; git checkout src/data reverts them.
await verify()
