import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MeetSinoSection } from '@/components/pages/home/meet-sino-section'
import { loadThankYouModel } from '@/components/pages/contact/contact-model'
import { ThankYouView } from '@/components/pages/contact/thank-you-view'
import { NotFoundView } from '@/components/pages/not-found/not-found-view'
import { FinalCta } from '@/components/sections/final-cta'
import { TwoPaths } from '@/components/sections/two-paths'
import { createStaticContentSource } from '../../src/content/static'
import en from '../../messages/en.json'
import {
  installIntersectionObserver,
  installMatchMedia,
  removeMatchMedia,
} from './motion-test-utils'
import { image } from './sections-test-utils'

// Where each loop lives (mascot-sino.md section 6): L-wave on the final CTA, L-phone
// and L-build on the two path cards, L-thumbs on the thank-you page, L-confused on the 404 page.
// The real manifest has every loop at ready: false. These tests flip all of them on together to
// prove each placement asks for the right loop, and leave them off to prove each placement still
// draws the still pose it showed before the loops existed.
const state = vi.hoisted(() => ({ ready: false }))

vi.mock('../../src/components/motion/sino-loops', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/components/motion/sino-loops')>()
  const loops = Object.fromEntries(
    Object.entries(original.SINO_LOOPS).map(([id, asset]) => [
      id,
      {
        ...asset,
        get ready() {
          return state.ready
        },
      },
    ]),
  ) as unknown as typeof original.SINO_LOOPS
  return {
    ...original,
    SINO_LOOPS: loops,
    isLoopReady: (id: keyof typeof loops) => loops[id].ready,
  }
})

beforeEach(() => {
  state.ready = false
  installIntersectionObserver()
  installMatchMedia(false)
  vi.stubGlobal('requestAnimationFrame', () => 0)
  vi.stubGlobal('cancelAnimationFrame', () => {})
  vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockImplementation((type: string) =>
    type.includes('vp9') ? 'probably' : '',
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  removeMatchMedia()
})

const videoSources = (root: ParentNode) =>
  [...root.querySelectorAll('video')].map((v) => v.getAttribute('src'))
const intl = (ui: React.ReactNode) =>
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>,
  )
const cta = { label: 'Go', href: '/x' }

describe('Meet Sino', () => {
  const ui = <MeetSinoSection title="Meet Sino" body="Body" tone="canvas" />

  // Meet Sino is the page's scroll-scrubbed scene now (motion.md 4.3), not a loop.
  it('plays the scroll-scrubbed look-up instead of a loop', () => {
    state.ready = true
    const { container } = render(ui)
    expect(videoSources(container)).toEqual([])
    expect(container.querySelector('[data-slot="scroll-scrub"]')).not.toBeNull()
  })
})

describe('final CTA', () => {
  const props = {
    headline: 'Ready',
    primaryCta: cta,
    image: image('wave still'),
  }

  it('shows L-wave when asked for it and the loop is ready', () => {
    state.ready = true
    const { container } = render(<FinalCta {...props} loop="L-wave" />)
    expect(videoSources(container)).toEqual(['/mascot/loops/sino-loop-wave.webm'])
  })

  it('draws the still when the loop is not ready, exactly as before', () => {
    const { container } = render(<FinalCta {...props} loop="L-wave" />)
    expect(videoSources(container)).toEqual([])
    expect(screen.getByAltText('wave still')).toBeTruthy()
  })

  it('draws the still when no loop is asked for', () => {
    state.ready = true
    const { container } = render(<FinalCta {...props} />)
    expect(videoSources(container)).toEqual([])
    expect(screen.getByAltText('wave still')).toBeTruthy()
  })
})

describe('TwoPaths cards', () => {
  const props = {
    product: {
      title: 'P',
      body: 'p',
      cta,
      image: image('phone still'),
      loop: 'L-phone' as const,
    },
    services: {
      title: 'S',
      body: 's',
      cta,
      image: image('blocks still'),
      loop: 'L-build' as const,
    },
  }

  it('plays L-phone on the product card and L-build on the services card when ready', () => {
    state.ready = true
    const { container } = render(<TwoPaths {...props} />)
    expect(videoSources(container)).toEqual([
      '/mascot/loops/sino-loop-phone.webm',
      '/mascot/loops/sino-loop-build.webm',
    ])
  })

  it('draws each card still while the loops are not ready', () => {
    const { container } = render(<TwoPaths {...props} />)
    expect(videoSources(container)).toEqual([])
    expect(screen.getByAltText('phone still')).toBeTruthy()
    expect(screen.getByAltText('blocks still')).toBeTruthy()
  })

  it('adds no empty pose slot for a card with no still and a loop that is not ready', () => {
    const { container } = render(
      <TwoPaths
        product={{ ...props.product, image: null }}
        services={{ ...props.services, image: null }}
      />,
    )
    expect(container.querySelectorAll('[data-slot="path-pose"]')).toHaveLength(0)
  })

  it('keeps a card without a loop on its still even when loops are ready', () => {
    state.ready = true
    const { container } = render(
      <TwoPaths
        product={{ ...props.product, loop: undefined }}
        services={{ ...props.services, loop: undefined }}
      />,
    )
    expect(videoSources(container)).toEqual([])
  })
})

describe('thank-you page', () => {
  async function view() {
    const model = (await loadThankYouModel(createStaticContentSource(), 'en'))!
    return intl(<ThankYouView model={model} />).container
  }

  it('plays L-thumbs when ready', async () => {
    state.ready = true
    expect(videoSources(await view())).toEqual(['/mascot/loops/sino-loop-thumbs.webm'])
  })

  it('keeps the thumbs-up still until then', async () => {
    const container = await view()
    expect(videoSources(container)).toEqual([])
    expect(container.querySelector('img')!.getAttribute('src')).toContain('sino-thumbs-up')
  })
})

describe('404 page', () => {
  async function view() {
    const page = (await createStaticContentSource().getPage('notFound', 'en'))!
    return intl(<NotFoundView page={page} />).container
  }

  it('plays L-confused when ready', async () => {
    state.ready = true
    expect(videoSources(await view())).toEqual(['/mascot/loops/sino-loop-confused.webm'])
  })

  it('keeps the decorative confused still until then', async () => {
    const container = await view()
    expect(videoSources(container)).toEqual([])
    const img = container.querySelector('img')!
    expect(img.getAttribute('src')).toContain('sino-confused')
    expect(img.getAttribute('alt')).toBe('')
  })
})
