import { GENDER_ORDER, GENDER_TONES } from '../constants/genderSplit'
import type { GenderSlice, SexRecord } from '../types'

function orderIndex(name: string): number {
  const index = GENDER_ORDER.indexOf(name)
  return index === -1 ? GENDER_ORDER.length : index
}

// Largest remainder: floor every share, then hand the leftover points to the
// shares that lost the most in rounding. Plain rounding lets a 50.5/49.5 print
// as 51% + 50%, which in a two-part bar reads as an error.
function roundToHundred(shares: number[]): number[] {
  const floors = shares.map(Math.floor)
  const leftover = 100 - floors.reduce((sum, value) => sum + value, 0)
  const byRemainder = shares
    .map((share, index) => ({ index, remainder: share - Math.floor(share) }))
    .sort((a, b) => b.remainder - a.remainder)

  const percents = [...floors]
  for (let i = 0; i < leftover && i < byRemainder.length; i++) {
    percents[byRemainder[i].index] += 1
  }
  return percents
}

export function toGenderSlices(stats: SexRecord[] | null): GenderSlice[] {
  const records = (stats ?? []).filter((record) => record?.sex_hebrew && record.count_1 > 0)
  const total = records.reduce((sum, record) => sum + record.count_1, 0)
  if (!total) return []

  // Array.sort is stable, so unknown labels keep the order the API sent them in.
  const ordered = [...records].sort((a, b) => orderIndex(a.sex_hebrew) - orderIndex(b.sex_hebrew))
  const shares = ordered.map((record) => (record.count_1 / total) * 100)
  const percents = roundToHundred(shares)

  return ordered.map((record, index) => ({
    name: record.sex_hebrew,
    count: record.count_1,
    share: shares[index],
    percent: percents[index],
    tone: GENDER_TONES[index % GENDER_TONES.length],
  }))
}
