import { describe, expect, it } from 'vitest'
import { config } from '../../src/proxy'

// Next.js compiles each matcher entry with path-to-regexp, but a raw-regex entry like ours
// (a single parenthesised negative lookahead) is evaluated as `^<pattern>$` against the pathname.
// Anchoring it the same way here keeps the test independent of the Next.js internals.
const matcher = new RegExp(`^${config.matcher[0]}$`)
const handledByIntl = (pathname: string) => matcher.test(pathname)

describe('proxy matcher', () => {
  it.each([
    '/mascot/sino.glb',
    '/mascot/poses/sino-wave.webp',
    '/mascot/poster/sino-hero.avif',
    '/draco/draco_decoder.wasm',
    '/og/default.png',
    '/brand/logo.svg',
    '/lottie/intro.json',
    '/favicon.ico',
    '/api/health',
    '/admin',
    '/admin/users',
    '/_next/static/chunk.js',
  ])('leaves the static or internal path %s alone', (pathname) => {
    expect(handledByIntl(pathname)).toBe(false)
  })

  it.each(['/', '/services', '/en/services', '/blog/some-post', '/contact'])(
    'still localizes the page path %s',
    (pathname) => {
      expect(handledByIntl(pathname)).toBe(true)
    },
  )

  // A page whose first segment merely starts with an excluded name must still be localized.
  it.each(['/mascots', '/drac', '/ogre', '/mascot-news'])(
    'does not over-match the look-alike page path %s',
    (pathname) => {
      expect(handledByIntl(pathname)).toBe(true)
    },
  )
})
