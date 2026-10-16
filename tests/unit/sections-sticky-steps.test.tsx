import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StickySteps } from '@/components/sections/sticky-steps'
import { publicFixtures } from '../fixtures/public'
import { installIntersectionObserver, flush, MockIntersectionObserver } from './motion-test-utils'
import { criticalAxeViolations, DESKTOP, REDUCED, stubMedia } from './sections-test-utils'

// GSAP is replaced by a recorder: the test drives the ScrollTrigger callbacks by hand, which is
// what "active step follows a simulated scroll progress" means without a real scroll.
const gsapMock = vi.hoisted(() => {
  type TriggerConfig = {
    trigger: Element
    scrub?: boolean | number
    start?: string
    end?: string
    onUpdate?: (self: { progress: number }) => void
  }
  const created: { config: TriggerConfig; kill: ReturnType<typeof vi.fn> }[] = []
  const bundle = {
    gsap: { context: (fn: () => void) => ({ revert: () => {}, kill: () => {}, add: fn }) },
    ScrollTrigger: {
      create: (config: TriggerConfig) => {
        const entry = { config, kill: vi.fn() }
        created.push(entry)
        return { kill: entry.kill, start: 100, end: 900, progress: 0 }
      },
      getAll: () => [],
    },
  }
  return { created, bundle, loadGsap: vi.fn(() => Promise.resolve(bundle)) }
})
vi.mock('@/lib/motion/gsap', () => ({ loadGsap: gsapMock.loadGsap }))

const steps = publicFixtures.pages.home.howWeWork.steps.map((s) => ({
  ...s,
  screen: <div data-testid={`screen-${s.title}`}>{s.title} screen</div>,
}))
const props = { title: publicFixtures.pages.home.howWeWork.title, steps }

beforeEach(() => {
  gsapMock.created.length = 0
  gsapMock.loadGsap.mockClear()
  installIntersectionObserver()
  stubMedia({ [DESKTOP]: true })
  // jsdom has no scrolling; selecting a step on desktop scrolls the page to that step.
  vi.stubGlobal('scrollTo', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const tabs = () => screen.getAllByRole('tab')

async function enterView() {
  const section = document.querySelector('[data-slot="sticky-steps"]') as HTMLElement
  act(() => MockIntersectionObserver.fire(section, { isIntersecting: true, intersectionRatio: 1 }))
  await act(async () => {
    await flush()
  })
}

describe('StickySteps content', () => {
  it('renders the header, every step title and body, and nothing for no steps', () => {
    const { container, rerender } = render(<StickySteps {...props} />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(props.title)
    for (const step of steps) {
      expect(screen.getByText(step.title)).toBeTruthy()
      expect(screen.getByText(step.body)).toBeTruthy()
    }
    rerender(<StickySteps {...props} steps={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('numbers the steps with a mono counter', () => {
    render(<StickySteps {...props} />)
    expect(screen.getByText('01')).toBeTruthy()
  })

  it('has no critical or serious axe violations', async () => {
    const { container } = render(<StickySteps {...props} />)
    expect(await criticalAxeViolations(container)).toEqual([])
  })
})

describe('StickySteps tab semantics', () => {
  it('is an ARIA tabs pattern with the first step selected', () => {
    render(<StickySteps {...props} />)
    expect(screen.getByRole('tablist')).toBeTruthy()
    expect(tabs()).toHaveLength(steps.length)
    expect(tabs().map((t) => t.getAttribute('aria-selected'))).toEqual(
      steps.map((_, i) => String(i === 0)),
    )
    expect(tabs().map((t) => t.getAttribute('tabindex'))).toEqual(
      steps.map((_, i) => (i === 0 ? '0' : '-1')),
    )
  })

  it('links the selected tab to a tabpanel that shows its screen', () => {
    render(<StickySteps {...props} />)
    const first = tabs()[0] as HTMLElement
    const panel = screen.getByRole('tabpanel')
    expect(first.getAttribute('aria-controls')).toBe(panel.id)
    expect(panel.getAttribute('aria-labelledby')).toBe(first.id)
    expect(within(panel).getAllByTestId(`screen-${steps[0]!.title}`).length).toBeGreaterThan(0)
  })

  it('selects a step on click and swaps the panel', async () => {
    const user = userEvent.setup()
    render(<StickySteps {...props} />)
    await user.click(tabs()[2] as HTMLElement)
    expect(tabs()[2]!.getAttribute('aria-selected')).toBe('true')
    expect(tabs()[0]!.getAttribute('aria-selected')).toBe('false')
    const panel = screen.getByRole('tabpanel')
    expect(panel.getAttribute('aria-labelledby')).toBe(tabs()[2]!.id)
    const active = panel.querySelector('[data-active="true"]') as HTMLElement
    expect(within(active).getByTestId(`screen-${steps[2]!.title}`)).toBeTruthy()
  })

  it('moves and selects with the arrow keys, wrapping, plus Home and End', async () => {
    const user = userEvent.setup()
    render(<StickySteps {...props} />)
    tabs()[0]!.focus()
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(tabs()[1])
    expect(tabs()[1]!.getAttribute('aria-selected')).toBe('true')
    await user.keyboard('{End}')
    expect(document.activeElement).toBe(tabs().at(-1))
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(tabs()[0])
    await user.keyboard('{ArrowUp}')
    expect(document.activeElement).toBe(tabs().at(-1))
    await user.keyboard('{Home}')
    expect(document.activeElement).toBe(tabs()[0])
  })

  it('makes each tab at least 44 px tall with a visible focus ring', () => {
    render(<StickySteps {...props} />)
    expect(tabs()[0]!.className).toContain('min-h-11')
    expect(tabs()[0]!.className).toContain('focus-visible:outline-focus')
  })

  it('renders a screen inside every step for the stacked mobile layout', () => {
    const { container } = render(<StickySteps {...props} />)
    expect(container.querySelectorAll('[data-slot="step-screen"]')).toHaveLength(steps.length)
    expect(container.querySelector('[data-slot="story-visual"]')).toBeTruthy()
  })
})

describe('StickySteps scroll story (GSAP ScrollTrigger scrub)', () => {
  it('does not load GSAP before the section nears the viewport', () => {
    render(<StickySteps {...props} />)
    expect(gsapMock.loadGsap).not.toHaveBeenCalled()
    expect(gsapMock.created).toHaveLength(0)
  })

  it('observes with a root margin so it loads just before the section is visible', () => {
    render(<StickySteps {...props} />)
    const io = MockIntersectionObserver.instances.at(-1)!
    expect(io.options?.rootMargin).toMatch(/px/)
  })

  it('loads GSAP once the section enters view and scrubs the steps list', async () => {
    render(<StickySteps {...props} />)
    await enterView()
    expect(gsapMock.loadGsap).toHaveBeenCalledTimes(1)
    expect(gsapMock.created).toHaveLength(1)
    const { config } = gsapMock.created[0]!
    expect(config.scrub).toBeTruthy()
    expect(config.trigger).toBe(document.querySelector('[data-slot="steps-list"]'))
  })

  it('stops observing after the first sighting (load once)', async () => {
    render(<StickySteps {...props} />)
    const io = MockIntersectionObserver.instances.at(-1)!
    await enterView()
    expect(io.disconnected).toBe(true)
  })

  it('makes the active step follow the scroll progress', async () => {
    render(<StickySteps {...props} />)
    await enterView()
    const { config } = gsapMock.created[0]!
    const n = steps.length
    const selected = () => tabs().findIndex((t) => t.getAttribute('aria-selected') === 'true')

    act(() => config.onUpdate?.({ progress: 0 }))
    expect(selected()).toBe(0)
    act(() => config.onUpdate?.({ progress: 0.6 }))
    expect(selected()).toBe(Math.floor(0.6 * n))
    act(() => config.onUpdate?.({ progress: 1 }))
    expect(selected()).toBe(n - 1)
    act(() => config.onUpdate?.({ progress: 0.2 }))
    expect(selected()).toBe(Math.floor(0.2 * n))
  })

  it('kills the ScrollTrigger on unmount', async () => {
    const { unmount } = render(<StickySteps {...props} />)
    await enterView()
    unmount()
    expect(gsapMock.created[0]!.kill).toHaveBeenCalled()
  })

  it('never loads GSAP under reduced motion, even when visible, and stays operable', async () => {
    stubMedia({ [DESKTOP]: true, [REDUCED]: true })
    const user = userEvent.setup()
    render(<StickySteps {...props} />)
    await enterView()
    expect(gsapMock.loadGsap).not.toHaveBeenCalled()
    await user.click(tabs()[1] as HTMLElement)
    expect(tabs()[1]!.getAttribute('aria-selected')).toBe('true')
  })

  it('does not use ScrollTrigger on the stacked mobile layout', async () => {
    stubMedia({ [DESKTOP]: false })
    render(<StickySteps {...props} />)
    await enterView()
    expect(gsapMock.loadGsap).not.toHaveBeenCalled()
    expect(gsapMock.created).toHaveLength(0)
    // The steps are still all in the DOM, stacked by CSS, each with its own screen.
    expect(document.querySelectorAll('[data-slot="step-screen"]')).toHaveLength(steps.length)
  })

  it('keeps a click selection until the scroll moves to another step', async () => {
    const user = userEvent.setup()
    render(<StickySteps {...props} />)
    await enterView()
    const { config } = gsapMock.created[0]!
    await user.click(tabs()[3] as HTMLElement)
    // A scroll update that still maps to the step the scroll was already on must not undo it.
    act(() => config.onUpdate?.({ progress: 0.01 }))
    expect(tabs()[3]!.getAttribute('aria-selected')).toBe('true')
    act(() => config.onUpdate?.({ progress: 0.6 }))
    expect(tabs()[Math.floor(0.6 * steps.length)]!.getAttribute('aria-selected')).toBe('true')
  })
})
