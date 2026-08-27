import { fileURLToPath } from 'node:url'

// The single constant a new edition changes. Drop next year's exports into
// data/source/2027/ under the same four names and change this line.
export const EDITION = '2026'

const REPO_ROOT = new URL('../../../', import.meta.url)

export function sourcePath(name: string): string {
  return fileURLToPath(new URL(`data/source/${EDITION}/${name}`, REPO_ROOT))
}

export function dataPath(name: string): string {
  return fileURLToPath(new URL(`src/data/${name}`, REPO_ROOT))
}
