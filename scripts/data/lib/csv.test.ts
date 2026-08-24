import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  formatYearRange,
  parseCount,
  parseCsv,
  parseYearRange,
  splitBlocks,
  findRowIndex,
} from './csv'

test('parseCsv keeps a comma that sits inside a quoted field', () => {
  assert.deepEqual(parseCsv('1,ירושלים,"22,239"'), [['1', 'ירושלים', '22,239']])
})

test('parseCsv unescapes a doubled quote', () => {
  assert.deepEqual(parseCsv('a,"סה""כ נפגעים",b'), [['a', 'סה"כ נפגעים', 'b']])
})

test('parseCsv keeps trailing empty cells', () => {
  assert.deepEqual(parseCsv('קורקינט חשמלי,,,מגמה:,317%'), [
    ['קורקינט חשמלי', '', '', 'מגמה:', '317%'],
  ])
})

test('splitBlocks divides on an all empty row and drops it', () => {
  const rows = [['a'], ['b'], ['', '', ''], ['c']]
  assert.deepEqual(splitBlocks(rows), [[['a'], ['b']], [['c']]])
})

test('splitBlocks does not emit a trailing empty block', () => {
  assert.deepEqual(splitBlocks([['a'], ['', '']]), [[['a']]])
})

test('findRowIndex matches on the first cell', () => {
  const rows = [['מגמה:'], ['התקופה הקודמת (2016-2021):', '']]
  assert.equal(findRowIndex(rows, 'התקופה הקודמת'), 1)
})

test('findRowIndex throws when nothing matches', () => {
  assert.throws(() => findRowIndex([['a']], 'b'), /b/)
})

test('parseCount strips a thousands separator', () => {
  assert.equal(parseCount('22,239'), 22239)
})

test('parseCount accepts a whole number written with a decimal zero', () => {
  assert.equal(parseCount('601.0'), 601)
})

test('parseCount rejects a fractional count', () => {
  assert.throws(() => parseCount('601.5'), /whole/)
})

test('parseCount rejects text', () => {
  assert.throws(() => parseCount('הרוגים'), /number/)
})

test('parseYearRange reads the earlier period label', () => {
  assert.deepEqual(parseYearRange('התקופה הקודמת (2016-2021):'), { start: 2016, end: 2021 })
})

test('parseYearRange sorts a visually ordered range', () => {
  assert.deepEqual(parseYearRange('20 היישובים בעלי הציון המשוקלל* הגבוה ביותר בין 2026-2021:'), {
    start: 2021,
    end: 2026,
  })
})

test('parseYearRange throws when a cell does not hold exactly two years', () => {
  assert.throws(() => parseYearRange('בין 2021:'), /two/)
})

test('formatYearRange prints ascending with a hyphen', () => {
  assert.equal(formatYearRange({ start: 2016, end: 2021 }), '2016-2021')
})
