import { readFileSync } from 'node:fs'

export type Row = string[]

export type YearRange = {
  start: number
  end: number
}

// Enough of RFC 4180 for these exports: quoted fields so a thousands separator
// survives, and a doubled quote for a literal one. The cities header carries
// both, in "סה""כ נפגעים".
function parseLine(line: string): Row {
  const cells: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]

    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        cell += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (char === ',' && !quoted) {
      cells.push(cell)
      cell = ''
    } else {
      cell += char
    }
  }

  cells.push(cell)
  return cells
}

export function parseCsv(text: string): Row[] {
  return text.replace(/\r\n/g, '\n').replace(/\n+$/, '').split('\n').map(parseLine)
}

export function readRows(path: string): Row[] {
  return parseCsv(readFileSync(path, 'utf8'))
}

// The severity export separates its five mode blocks with a row of nothing but
// commas. A trailing separator produces no block, so the last mode is not
// followed by an empty one.
export function splitBlocks(rows: Row[]): Row[][] {
  const blocks: Row[][] = []
  let current: Row[] = []

  for (const row of rows) {
    if (row.every((cell) => cell.trim() === '')) {
      if (current.length > 0) blocks.push(current)
      current = []
    } else {
      current.push(row)
    }
  }

  if (current.length > 0) blocks.push(current)
  return blocks
}

// Rows are found by what they say, not by where they sit, so a source that
// gains a row fails on the assertion that follows rather than reading the wrong
// cell silently.
export function findRowIndex(rows: Row[], startsWith: string): number {
  const index = rows.findIndex((row) => row[0].trim().startsWith(startsWith))
  if (index === -1) {
    throw new Error(`no row starting with ${JSON.stringify(startsWith)}`)
  }
  return index
}

// Counts arrive as "22,239" from the score column and as "601.0" from the
// overview. Both are whole numbers of people; a genuinely fractional value
// means the column is not what this parser thinks it is.
export function parseCount(cell: string): number {
  const cleaned = cell.trim().replace(/,/g, '')
  const value = Number(cleaned)

  if (cleaned === '' || !Number.isFinite(value)) {
    throw new Error(`not a number: ${JSON.stringify(cell)}`)
  }
  if (!Number.isInteger(value)) {
    throw new Error(`not a whole count: ${JSON.stringify(cell)}`)
  }
  return value
}

// The captions print their ranges in visual order, so "2026-2021" and
// "2016-2021" both appear and mean ascending ranges. Sort rather than trust the
// order they were written in.
export function parseYearRange(cell: string): YearRange {
  const years = cell.match(/\d{4}/g)
  if (years === null || years.length !== 2) {
    throw new Error(`expected two years in ${JSON.stringify(cell)}`)
  }

  const [start, end] = years.map(Number).sort((a, b) => a - b)
  return { start, end }
}

export function formatYearRange(range: YearRange): string {
  return `${range.start}-${range.end}`
}
