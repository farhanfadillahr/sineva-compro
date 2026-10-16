import { afterEach, describe, expect, it } from 'vitest'
import { lockScroll } from '../../src/components/brand/splash-scroll-lock'

const html = document.documentElement

afterEach(() => {
  html.removeAttribute('style')
})

describe('lockScroll', () => {
  it('stops the page scrolling and keeps the scrollbar gutter, so the page does not shift', () => {
    lockScroll()
    expect(html.style.overflow).toBe('hidden')
    expect(html.style.scrollbarGutter).toBe('stable')
  })

  it('puts back exactly what was there before', () => {
    html.style.overflow = 'scroll'
    html.style.scrollbarGutter = 'auto'
    const unlock = lockScroll()
    unlock()
    expect(html.style.overflow).toBe('scroll')
    expect(html.style.scrollbarGutter).toBe('auto')
  })

  it('leaves no inline style behind when there was none', () => {
    const unlock = lockScroll()
    unlock()
    expect(html.getAttribute('style') ?? '').toBe('')
  })

  it('restores only once, so a second call cannot undo something that changed since', () => {
    const unlock = lockScroll()
    unlock()
    html.style.overflow = 'clip'
    unlock()
    expect(html.style.overflow).toBe('clip')
  })
})
