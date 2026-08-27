// A builder that cannot vouch for a value refuses to emit it. Every failure
// carries enough context to point at the cell that caused it, because the
// person reading the message is looking at a CSV, not at this code.
export function fail(message: string): never {
  throw new Error(message)
}

export function assertEqual(actual: unknown, expected: unknown, context: string): void {
  if (actual !== expected) {
    fail(`${context}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

export function assertSum(parts: number[], total: number, context: string): void {
  const sum = parts.reduce((running, part) => running + part, 0)
  if (sum !== total) {
    fail(`${context}: parts sum to ${sum}, printed total is ${total}`)
  }
}
