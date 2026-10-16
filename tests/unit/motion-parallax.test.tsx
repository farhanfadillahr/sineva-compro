// Scroll parallax for visuals that are not Sino poses (AnimatedPose has its own, see
// animated-pose.test.tsx): hero visuals and phone mockups. Transform only, passive listeners, off
// under reduced motion, and the server-rendered state is the final one.
import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Parallax } from '@/components/motion/Parallax'
import { PARALLAX_MAX_PX, scrollParallaxOffset } from '@/components/motion/animated-pose-math'
import { HeroSplit } from '@/components/sections'
import { ServiceDetailView } from '@/components/pages/services/service-detail-view'
import { ServicesListView } from '@/components/pages/services/services-list-view'
import {
  loadServiceDetailModel,
  loadServicesListModel,
} from '@/components/pages/services/services-model'
import { servicesLabelsFromMessages } from '@/components/pages/services/services-labels'
import { loadProductModel } from '@/components/pages/product/product-model'
import { ProductView } from '@/components/pages/product/product-view'
import { productLabelsFromMessages } from '@/components/pages/product/product-labels'
import { createFixtureContentSource } from '../../src/features/content/fixture-source'
import en from '../../messages/en.json'
import { installIntersectionObserver } from './motion-test-utils'
import { image, REDUCED, stubMedia } from './sections-test-utils'

const FIXTURE = createFixtureContentSource()

// rAF callbacks are queued and flushed by hand, like a browser's next frame. Running them inside
// the requestAnimationFrame call would finish before it returned its id.
let frames: FrameRequestCallback[] = []
function flushFrames() {
  const run = frames
  frames = []
  act(() => run.forEach((cb) => cb(0)))
}

function setScroll(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  act(() => {
    window.dispatchEvent(new Event('scroll'))
  })
  flushFrames()
}

beforeEach(() => {
  stubMedia({})
  installIntersectionObserver()
  frames = []
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
  vi.stubGlobal('cancelAnimationFrame', () => {})
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('scrollParallaxOffset', () => {
  it('is zero at the top, so a hero does not jump when the script starts', () => {
    expect(scrollParallaxOffset(0)).toBe(0)
  })
  it('drifts (1 - 0.92) px per scrolled px, down against the scroll', () => {
    expect(scrollParallaxOffset(100)).toBe(8)
    expect(scrollParallaxOffset(250)).toBe(20)
  })
  it('clamps to the same range as the poses', () => {
    expect(scrollParallaxOffset(5000)).toBe(PARALLAX_MAX_PX)
    // Overscroll above the top (iOS rubber band) must not push the visual up.
    expect(scrollParallaxOffset(-300)).toBe(0)
  })
})

describe('Parallax', () => {
  it('renders the children in their final state: no offset in the server markup', () => {
    const { container } = render(
      <Parallax mode="top">
        <p>visual</p>
      </Parallax>,
    )
    const layer = container.querySelector<HTMLElement>(
      '[data-parallax] > [data-slot="parallax-layer"]',
    )!
    expect(layer.textContent).toBe('visual')
    expect(layer.style.getPropertyValue('--parallax-y')).toBe('')
  })

  it('in top mode writes the offset on scroll, transform variable only', () => {
    const { container } = render(<Parallax mode="top">x</Parallax>)
    const layer = container.querySelector<HTMLElement>('[data-slot="parallax-layer"]')!
    setScroll(200)
    expect(layer.style.getPropertyValue('--parallax-y')).toBe('16px')
    setScroll(2000)
    expect(layer.style.getPropertyValue('--parallax-y')).toBe(`${PARALLAX_MAX_PX}px`)
    // Nothing but the variable is written: no top, height or layout property.
    expect(layer.getAttribute('style')).toBe(`--parallax-y: ${PARALLAX_MAX_PX}px;`)
  })

  it('listens passively and removes its listeners on unmount', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<Parallax mode="top">x</Parallax>)
    const scrollCalls = add.mock.calls.filter(([type]) => type === 'scroll')
    expect(scrollCalls.length).toBeGreaterThan(0)
    for (const call of scrollCalls) expect(call[2]).toMatchObject({ passive: true })
    unmount()
    expect(remove.mock.calls.some(([type]) => type === 'scroll')).toBe(true)
  })

  it('does nothing under reduced motion: no listener, no variable', () => {
    stubMedia({ [REDUCED]: true })
    const add = vi.spyOn(window, 'addEventListener')
    const { container } = render(<Parallax mode="top">x</Parallax>)
    const layer = container.querySelector<HTMLElement>('[data-slot="parallax-layer"]')!
    setScroll(300)
    expect(add.mock.calls.some(([type]) => type === 'scroll')).toBe(false)
    expect(layer.style.getPropertyValue('--parallax-y')).toBe('')
  })

  it('in centre mode waits until the block is in view', () => {
    const add = vi.spyOn(window, 'addEventListener')
    render(<Parallax>x</Parallax>)
    expect(add.mock.calls.some(([type]) => type === 'scroll')).toBe(false)
  })
})

describe('parallax on the hero visuals', () => {
  const labels = servicesLabelsFromMessages(en)
  const heroOf = () => document.querySelector<HTMLElement>('[data-services-section="hero"]')!

  it('Services list hero poster moves', async () => {
    const model = (await loadServicesListModel(FIXTURE, 'en'))!
    render(<ServicesListView model={model} labels={labels} />)
    expect(heroOf().querySelector('[data-parallax]')).not.toBeNull()
    // The headline is never inside it: only the visual moves.
    expect(heroOf().querySelector('h1')!.closest('[data-parallax]')).toBeNull()
  })

  it('Service detail hero poster moves', async () => {
    const model = (await loadServiceDetailModel(FIXTURE, 'ai-build', 'en'))!
    render(<ServiceDetailView model={model} labels={labels} />)
    expect(heroOf().querySelector('[data-parallax]')).not.toBeNull()
  })

  it('phone mockups do not move: a drifting phone slid under the card captions', async () => {
    const model = (await loadProductModel(FIXTURE, 'en'))!
    render(<ProductView model={model} labels={productLabelsFromMessages(en)} />)
    for (const phone of document.querySelectorAll('[data-slot="phone-frame"]')) {
      expect(phone.closest('[data-parallax]')).toBeNull()
    }
    expect(document.querySelectorAll('[data-slot="phone-frame"]').length).toBeGreaterThan(0)
  })

  it('the Sino canvas hero keeps its own rig parallax: the poster underneath does not move', () => {
    const { container } = render(
      <HeroSplit
        variant="sino-canvas"
        headline="H"
        lead="L"
        primaryCta={null}
        image={image('Sino', 1600, 900)}
        priority
        canvas={<div data-testid="canvas" />}
      />,
    )
    expect(container.querySelector('[data-parallax]')).toBeNull()
  })

  it('the hero poster stays a plain priority image (LCP): parallax adds no reveal', () => {
    const { container } = render(
      <HeroSplit
        variant="sino-still"
        headline="H"
        lead="L"
        primaryCta={null}
        image={image('Sino', 1600, 900)}
        priority
      />,
    )
    expect(container.querySelector('[data-parallax]')).not.toBeNull()
    expect(container.querySelector('[data-parallax] [data-reveal]')).toBeNull()
  })
})
