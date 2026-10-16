import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installMatchMedia, REDUCED_MOTION_QUERY, removeMatchMedia } from './layout-test-utils'

const HOVER_QUERY = '(hover: hover) and (pointer: fine)'

// Same stand-in as logo-intro.test.tsx: the symbol replay only depends on the box the player
// renders, its data-lottie-state, and the completion callback.
const player = vi.hoisted(() => ({
  state: 'ready' as 'ready' | 'loading' | 'error',
  onComplete: undefined as undefined | (() => void),
}))
vi.mock('../../src/components/motion/LottiePlayer', async () => {
  const { createElement } = await import('react')
  return {
    LottiePlayer: (props: { src: string; onComplete?: () => void }) => {
      player.onComplete = props.onComplete
      return createElement('div', {
        'data-testid': 'symbol-lottie',
        'data-src': props.src,
        'data-lottie-state': player.state,
      })
    },
  }
})

import { LogoSymbol } from '../../src/components/brand/logo-symbol'

function renderSymbol() {
  // Hover is observed on the surrounding link, like the real navbar logo.
  render(
    <a href="#home" data-testid="link">
      <LogoSymbol src="/brand/sineva-symbol-original.svg" replayOnHover />
    </a>,
  )
  return screen.getByTestId('link')
}

const replay = () => screen.queryByTestId('symbol-lottie')
const staticImg = () => document.querySelector<HTMLImageElement>('img')!

function hover(link: HTMLElement) {
  act(() => {
    fireEvent.pointerEnter(link, { pointerType: 'mouse' })
  })
}

function finish() {
  act(() => player.onComplete?.())
}

beforeEach(() => {
  vi.useFakeTimers()
  installMatchMedia({ [REDUCED_MOTION_QUERY]: false, [HOVER_QUERY]: true })
  player.state = 'ready'
  player.onComplete = undefined
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('LogoSymbol', () => {
  it('renders the static SVG by default and nothing else', () => {
    renderSymbol()
    expect(staticImg().getAttribute('src')).toBe('/brand/sineva-symbol-original.svg')
    expect(staticImg().getAttribute('alt')).toBe('')
    expect(replay()).toBeNull()
  })

  it('replays the symbol Lottie on hover and swaps back to the static SVG when it ends', () => {
    const link = renderSymbol()
    hover(link)
    expect(replay()!.getAttribute('data-src')).toBe('/lottie/sineva-symbol-intro.json')
    expect(staticImg().style.opacity).toBe('0')
    finish()
    expect(replay()).toBeNull()
    expect(staticImg().style.opacity).toBe('')
  })

  it('keeps the static SVG visible until the player is ready, so there is no blink', () => {
    player.state = 'loading'
    const link = renderSymbol()
    hover(link)
    expect(staticImg().style.opacity).toBe('')
  })

  it('replays at most once per 10 s', () => {
    const link = renderSymbol()
    hover(link)
    finish()
    expect(replay()).toBeNull()

    vi.advanceTimersByTime(9_999)
    hover(link)
    expect(replay()).toBeNull()

    vi.advanceTimersByTime(1)
    hover(link)
    expect(replay()).not.toBeNull()
  })

  it('ignores a second hover while a replay is already running', () => {
    const link = renderSymbol()
    hover(link)
    hover(link)
    expect(screen.getAllByTestId('symbol-lottie')).toHaveLength(1)
  })

  it('does not replay under reduced motion', () => {
    installMatchMedia({ [REDUCED_MOTION_QUERY]: true, [HOVER_QUERY]: true })
    const link = renderSymbol()
    hover(link)
    expect(replay()).toBeNull()
  })

  it('does not replay without a fine hovering pointer (touch, desktop only)', () => {
    installMatchMedia({ [REDUCED_MOTION_QUERY]: false, [HOVER_QUERY]: false })
    const link = renderSymbol()
    hover(link)
    expect(replay()).toBeNull()
  })

  it('does not replay on touch pointers even when the media query says hover', () => {
    const link = renderSymbol()
    act(() => {
      fireEvent.pointerEnter(link, { pointerType: 'touch' })
    })
    expect(replay()).toBeNull()
  })

  it('does not replay when the option is off (footer symbol)', () => {
    render(
      <a href="#home" data-testid="link">
        <LogoSymbol src="/brand/sineva-symbol-original.svg" />
      </a>,
    )
    hover(screen.getByTestId('link'))
    expect(replay()).toBeNull()
  })

  it('does not replay when matchMedia is missing', () => {
    removeMatchMedia()
    const link = renderSymbol()
    hover(link)
    expect(replay()).toBeNull()
  })

  it('falls back to the static SVG if the replay never completes', () => {
    const link = renderSymbol()
    hover(link)
    act(() => {
      vi.advanceTimersByTime(2_000)
    })
    expect(replay()).toBeNull()
    expect(staticImg().style.opacity).toBe('')
  })

  it('falls back to the static SVG if the Lottie fails to load', () => {
    player.state = 'error'
    const link = renderSymbol()
    hover(link)
    expect(replay()).toBeNull()
    expect(staticImg().style.opacity).toBe('')
  })
})
