import { describe, expect, it } from 'vitest'
import { shouldPlayIntro } from '../../src/components/brand/intro-gate'

const base = { enabled: true, reducedMotion: false, webdriver: false }

describe('shouldPlayIntro', () => {
  it('plays on every full page load with the toggle on, motion allowed and a human browser', () => {
    expect(shouldPlayIntro(base)).toBe(true)
  })

  it.each([
    ['the site toggle is off', { enabled: false }],
    ['the visitor prefers reduced motion', { reducedMotion: true }],
    ['the browser is automated', { webdriver: true }],
  ])('does not play when %s', (_label, override) => {
    expect(shouldPlayIntro({ ...base, ...override })).toBe(false)
  })

  describe('test-only force flag', () => {
    it('lets an automated browser through, so Lighthouse and Playwright can see the intro', () => {
      expect(shouldPlayIntro({ ...base, webdriver: true, force: true })).toBe(true)
    })

    it.each([
      ['the toggle is off', { enabled: false }],
      ['the visitor prefers reduced motion', { reducedMotion: true }],
    ])('never overrides a real user rule: %s', (_label, override) => {
      expect(shouldPlayIntro({ ...base, webdriver: true, force: true, ...override })).toBe(false)
    })
  })
})
