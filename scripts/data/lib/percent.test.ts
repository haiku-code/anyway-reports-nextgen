import { test } from 'node:test'
import assert from 'node:assert/strict'
import { percentChange, precisionOf, roundHalfUp, toSignedLabel } from './percent'

test('precisionOf counts the decimals a label shows', () => {
  assert.equal(precisionOf('+317%'), 0)
  assert.equal(precisionOf('-1%'), 0)
  assert.equal(precisionOf('+3.67%'), 2)
  assert.equal(precisionOf('191.4'), 1)
})

test('roundHalfUp rounds a half away from zero, not toward positive infinity', () => {
  assert.equal(roundHalfUp(462.5, 0), 463)
  assert.equal(roundHalfUp(-0.5, 0), -1)
  assert.equal(roundHalfUp(-1.235, 0), -1)
  assert.equal(roundHalfUp(3.6727, 2), 3.67)
})

test('percentChange is the signed change between two counts', () => {
  assert.equal(roundHalfUp(percentChange(90, 16), 0), 463)
  assert.equal(roundHalfUp(percentChange(690, 966), 0), -29)
  assert.equal(roundHalfUp(percentChange(4, 4), 0), 0)
})

test('percentChange refuses a change from zero', () => {
  assert.throws(() => percentChange(5, 0), /zero/)
})

test('toSignedLabel adds a leading plus to a rise', () => {
  assert.equal(toSignedLabel('317%'), '+317%')
})

test('toSignedLabel keeps a minus', () => {
  assert.equal(toSignedLabel('-100%'), '-100%')
})

test('toSignedLabel leaves a flat value unsigned', () => {
  assert.equal(toSignedLabel('0%'), '0%')
})

test('toSignedLabel drops the Hebrew word the overview export prefixes', () => {
  assert.equal(toSignedLabel('עליה +3.67%'), '+3.67%')
  assert.equal(toSignedLabel('עליה +30%'), '+30%')
})

test('toSignedLabel throws when a cell holds no percentage', () => {
  assert.throws(() => toSignedLabel('מגמה:'), /percentage/)
})
