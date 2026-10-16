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
    '/mascot/poses/v008/sino-wave.webp',
    '/mascot/poster/v008/sino-hero.avif',
    '/draco/draco_decoder.wasm',
    '/og/default-v008.png',
    '/brand/logo.svg',
    '/lottie/intro.json',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/manifest.webmanifest',
    '/icon.svg',
    '/icon1.png',
    '/apple-icon.png',
    '/icon-1k2j3z.svg',
    '/apple-icon-1k2j3z.png',
    '/_next/static/chunk.js',
  ])('leaves the static or internal path %s alone', (pathname) => {
    expect(handledByIntl(pathname)).toBe(false)
  })

  // The proxy itself decides what to do with these (404 when the admin is off, no localization
  // either way), so the matcher must let them through.
  it.each(['/admin', '/admin/users', '/api/health', '/api/auth/get-session'])(
    'lets the admin or api path %s reach the proxy',
    (pathname) => {
      expect(handledByIntl(pathname)).toBe(true)
    },
  )

  it.each(['/', '/services', '/en/services', '/blog/some-post', '/contact'])(
    'still localizes the page path %s',
    (pathname) => {
      expect(handledByIntl(pathname)).toBe(true)
    },
  )

  // A page whose first segment merely starts with an excluded name must still be localized.
  it.each([
    '/mascots',
    '/drac',
    '/ogre',
    '/mascot-news',
    '/icon',
    '/icons',
    '/icon.svg.html',
    '/iconography',
    '/manifest',
    '/manifest.webmanifest/extra',
    '/en/icon.svg',
  ])('does not over-match the look-alike page path %s', (pathname) => {
    expect(handledByIntl(pathname)).toBe(true)
  })
})
