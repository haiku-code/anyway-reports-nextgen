// How many decimals a printed percentage shows. The overview export prints
// "+3.67%" and "+30%" on one row, so there is no single rounding rule that
// matches the sources; each figure is checked at the precision it was written
// with.
export function precisionOf(label: string): number {
  const digits = label.replace(/[^\d.]/g, '')
  const dot = digits.indexOf('.')
  return dot === -1 ? 0 : digits.length - dot - 1
}

// Half up on the magnitude, sign reapplied. Math.round rounds toward positive
// infinity, so Math.round(-0.5) is -0, which is the wrong direction for a
// figure the source rounded by magnitude.
export function roundHalfUp(value: number, decimals: number): number {
  const factor = 10 ** decimals
  const rounded = Math.round(Math.abs(value) * factor) / factor
  return value < 0 ? -rounded : rounded
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) {
    throw new Error('cannot express a change from zero as a percentage')
  }
  return ((current - previous) / previous) * 100
}

// The exports write a rise without a sign ("317%") and prefix the overview
// figures with a word ("עליה +3.67%"). The report prints an explicit sign, so
// the pipeline normalises to the form that will appear on the page.
export function toSignedLabel(cell: string): string {
  const match = cell.trim().match(/([+-]?)(\d+(?:\.\d+)?)%/)
  if (match === null) {
    throw new Error(`no percentage in ${JSON.stringify(cell)}`)
  }

  const [, sign, digits] = match
  if (Number(digits) === 0) return '0%'
  return `${sign === '-' ? '-' : '+'}${digits}%`
}
