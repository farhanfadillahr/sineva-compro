import { existsSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { LOOP_IDS, SINO_LOOPS } from '../../src/components/motion/sino-loops'

// Byte budgets from docs/design/3d-asset-requirements.md section 2 (stills 120 KB, OG 300 KB)
// and docs/design/mascot-sino.md section 8 (GLB). The poster gets 150 KB because it is the LCP
// image and covers a larger frame (1600 px) than a pose still (1200 px). KB is 1000 bytes here
// on purpose: the stricter reading, so a file that is exactly at the limit still fits when a
// tool reports kibibytes.
const KB = 1000
const publicPath = (...parts: string[]) =>
  fileURLToPath(new URL(`../../public/${parts.join('/')}`, import.meta.url))

const POSES = [
  'sino-wave',
  'sino-holding-phone',
  'sino-laptop',
  'sino-megaphone',
  'sino-coins',
  'sino-handshake',
  'sino-magnifier',
  'sino-blocks',
  'sino-whiteboard',
  'sino-thumbs-up',
  'sino-confused',
  'sino-relaxed',
] as const

const sizeOf = (path: string) => statSync(path).size

// The loop files are rendered by the assets lane and arrive after the code that plays them, so a
// missing file is not a failure here: the manifest keeps `ready: false` and the page draws the
// still. What the budget guards is the day they do arrive. A loop that is marked ready while a
// file is missing fails in sino-loops-source.test.ts instead.
const LOOP_BUDGET = 900 * KB
const LOOP_POSTER_BUDGET = 120 * KB

describe('static asset budgets (phase 1)', () => {
  describe('pose stills', () => {
    for (const name of POSES) {
      it(`${name}.webp exists and is at most 120 KB`, () => {
        const file = publicPath('mascot', 'poses', `${name}.webp`)
        expect(existsSync(file), `${file} is missing`).toBe(true)
        expect(sizeOf(file)).toBeLessThanOrEqual(120 * KB)
      })

      it(`${name}.avif exists and is at most 120 KB`, () => {
        const file = publicPath('mascot', 'poses', `${name}.avif`)
        expect(existsSync(file), `${file} is missing`).toBe(true)
        expect(sizeOf(file)).toBeLessThanOrEqual(120 * KB)
      })
    }
  })

  describe('hero poster', () => {
    for (const ext of ['webp', 'avif'] as const) {
      it(`sino-hero.${ext} exists and is at most 150 KB`, () => {
        const file = publicPath('mascot', 'poster', `sino-hero.${ext}`)
        expect(existsSync(file), `${file} is missing`).toBe(true)
        expect(sizeOf(file)).toBeLessThanOrEqual(150 * KB)
      })
    }
  })

  describe('open graph image', () => {
    it('og/default.png exists and is at most 300 KB', () => {
      const file = publicPath('og', 'default.png')
      expect(existsSync(file), `${file} is missing`).toBe(true)
      expect(sizeOf(file)).toBeLessThanOrEqual(300 * KB)
    })
  })

  describe('realtime model', () => {
    it('mascot/sino.glb exists and is at most 1.2 MB raw (draco)', () => {
      const file = publicPath('mascot', 'sino.glb')
      expect(existsSync(file), `${file} is missing`).toBe(true)
      expect(sizeOf(file)).toBeLessThanOrEqual(1_200_000)
    })

    // The decoder is self-hosted (CSP and privacy, mascot-sino.md section 2), so the three
    // files GLTFLoader requests by name must be served from /draco/.
    for (const decoderFile of ['draco_decoder.js', 'draco_decoder.wasm', 'draco_wasm_wrapper.js']) {
      it(`draco/${decoderFile} is self-hosted`, () => {
        const file = publicPath('draco', decoderFile)
        expect(existsSync(file), `${file} is missing`).toBe(true)
        expect(sizeOf(file)).toBeGreaterThan(0)
      })
    }
  })

  // Skipped (not passed) per file when absent, so the report shows which loops are still to come.
  describe('video loops', () => {
    for (const id of LOOP_IDS) {
      const loop = SINO_LOOPS[id]
      const files = [
        ['webm', loop.webm, LOOP_BUDGET],
        ['mov', loop.mov, LOOP_BUDGET],
        // The poster is a still, so it follows the still budget, not the video one.
        ['poster', loop.poster, LOOP_POSTER_BUDGET],
      ] as const
      for (const [kind, url, budget] of files) {
        const file = publicPath(url.replace(/^\//, ''))
        it.skipIf(!existsSync(file))(`${id} ${kind} is at most ${budget / KB} KB`, () => {
          expect(sizeOf(file)).toBeLessThanOrEqual(budget)
        })
      }
    }
  })
})
