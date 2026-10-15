import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { findDashViolationsInTree } from '../../src/lib/copy/walk'

const MESSAGES_DIR = fileURLToPath(new URL('../../messages', import.meta.url))

// Scans every messages/*.json that exists, so adding or removing a locale needs no edit here.
const messageFiles = readdirSync(MESSAGES_DIR)
  .filter((name) => name.endsWith('.json'))
  .sort()

/** One `file:path  U+XXXX "char"` line per offending string, for a readable failure. */
function lintBundle(file: string, bundle: unknown): string[] {
  return findDashViolationsInTree(bundle).map(({ path: keyPath, violation }) => {
    const hex = violation.codePoint.toString(16).toUpperCase().padStart(4, '0')
    return `${file}:${keyPath} contains U+${hex} (${violation.char})`
  })
}

describe('copy lint: messages/*.json', () => {
  it('finds at least one message bundle', () => {
    expect(messageFiles.length).toBeGreaterThan(0)
  })

  it.each(messageFiles)('%s has no em dash, en dash or look-alike', (file) => {
    const bundle: unknown = JSON.parse(readFileSync(path.join(MESSAGES_DIR, file), 'utf8'))
    expect(lintBundle(file, bundle)).toEqual([])
  })

  it('reports file, key path and character when a dash sneaks in', () => {
    const bundle = { Home: { hero: { title: 'Fast — simple' } }, list: ['ok', 'a &ndash; b'] }
    expect(lintBundle('en.json', bundle)).toEqual([
      'en.json:Home.hero.title contains U+2014 (—)',
      'en.json:list[1] contains U+2013 (&ndash;)',
    ])
  })
})
