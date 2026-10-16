import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installIntersectionObserver, flush, MockIntersectionObserver } from './motion-test-utils'
import { DESKTOP, REDUCED, stubMedia } from './sections-test-utils'

// Unlike sections-sticky-steps.test.tsx, nothing in the loader is mocked here except the gsap
// packages themselves. The factories below only run when something really imports the library, so
// the counter measures the real lazy-load behaviour: no download before the section nears the
// viewport, none under reduced motion, none on the stacked mobile layout.
const imports = vi.hoisted(() => ({ gsap: 0, scrollTrigger: 0, created: 0 }))

vi.mock('gsap', () => {
  imports.gsap++
  const gsap = {
    registerPlugin: () => {},
    context: (fn: () => void) => {
      fn()
      return { revert: () => {}, kill: () => {} }
    },
  }
  return { gsap, default: gsap }
})
vi.mock('gsap/ScrollTrigger', () => {
  imports.scrollTrigger++
  const ScrollTrigger = {
    create: () => {
      imports.created++
      return { kill: () => {}, start: 0, end: 1 }
    },
    getAll: () => [],
  }
  return { ScrollTrigger, default: ScrollTrigger }
})

const steps = [
  { title: 'Talk', body: 'We listen.', screen: <span>a</span> },
  { title: 'Plan', body: 'We plan.', screen: <span>b</span> },
]

async function mountAndSightSection() {
  // A fresh module graph per test: loadGsap caches its promise at module level.
  vi.resetModules()
  const { StickySteps } = await import('@/components/sections/sticky-steps')
  render(<StickySteps title="How we work" steps={steps} />)
  const section = document.querySelector('[data-slot="sticky-steps"]') as HTMLElement
  act(() => MockIntersectionObserver.fire(section, { isIntersecting: true, intersectionRatio: 1 }))
  await act(async () => {
    await flush(10)
  })
}

beforeEach(() => {
  imports.gsap = 0
  imports.scrollTrigger = 0
  imports.created = 0
  installIntersectionObserver()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('StickySteps lazy GSAP loading', () => {
  it('imports nothing at render time and nothing until the section is sighted', async () => {
    stubMedia({ [DESKTOP]: true })
    vi.resetModules()
    const { StickySteps } = await import('@/components/sections/sticky-steps')
    render(<StickySteps title="How we work" steps={steps} />)
    await act(async () => {
      await flush(10)
    })
    expect(imports).toMatchObject({ gsap: 0, scrollTrigger: 0, created: 0 })
  })

  it('imports gsap and ScrollTrigger once, after the section is sighted on desktop', async () => {
    stubMedia({ [DESKTOP]: true })
    await mountAndSightSection()
    expect(imports.gsap).toBe(1)
    expect(imports.scrollTrigger).toBe(1)
    expect(imports.created).toBe(1)
  })

  it('never imports gsap under reduced motion', async () => {
    stubMedia({ [DESKTOP]: true, [REDUCED]: true })
    await mountAndSightSection()
    expect(imports).toMatchObject({ gsap: 0, scrollTrigger: 0, created: 0 })
  })

  it('never imports gsap on the stacked mobile layout', async () => {
    stubMedia({ [DESKTOP]: false })
    await mountAndSightSection()
    expect(imports).toMatchObject({ gsap: 0, scrollTrigger: 0, created: 0 })
  })
})
