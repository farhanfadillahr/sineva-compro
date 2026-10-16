import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { frameFor, scrubProgress } from '@/components/motion/scroll-scrub-math'
import { ScrollScrubSequence } from '@/components/motion/ScrollScrubSequence'

describe('scrubProgress', () => {
  // Starts when the element top reaches 72 % of the viewport, ends when its centre reaches 42 %.
  it('is 0 before the element enters and 1 once its centre passes the middle', () => {
    expect(scrubProgress({ top: 1000, height: 400 }, 800)).toBe(0)
    expect(scrubProgress({ top: 100, height: 400 }, 800)).toBe(1)
    expect(scrubProgress({ top: -500, height: 400 }, 800)).toBe(1)
  })

  it('moves monotonically in between', () => {
    const a = scrubProgress({ top: 500, height: 400 }, 800)
    const b = scrubProgress({ top: 300, height: 400 }, 800)
    expect(a).toBeGreaterThan(0)
    expect(b).toBeGreaterThan(a)
    expect(b).toBeLessThan(1)
  })
})

describe('frameFor', () => {
  it('maps progress to a frame index and clamps', () => {
    expect(frameFor(0, 36)).toBe(0)
    expect(frameFor(1, 36)).toBe(35)
    expect(frameFor(0.5, 36)).toBe(18)
    expect(frameFor(-1, 36)).toBe(0)
    expect(frameFor(2, 36)).toBe(35)
  })
})

describe('ScrollScrubSequence', () => {
  const props = {
    sprite: '/mascot/scrub/sino-look-up.webp',
    poster: '/mascot/scrub/sino-look-up-end.webp',
    frames: 36,
    cols: 6,
    frameWidth: 480,
    frameHeight: 480,
  }

  it('renders the final frame as a decorative poster, so the server HTML shows the finished pose', () => {
    const { container } = render(<ScrollScrubSequence {...props} />)
    const root = container.querySelector('[data-slot="scroll-scrub"]') as HTMLElement
    expect(root.getAttribute('aria-hidden')).toBe('true')
    const img = root.querySelector('img') as HTMLImageElement
    expect(img.getAttribute('src')).toBe(props.poster)
    expect(img.getAttribute('alt')).toBe('')
    expect(root.querySelector('canvas')).not.toBeNull()
  })
})
