// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { StrictMode, createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { claimSessionOnce, useOncePerSession } from '../../src/lib/motion/session'

beforeEach(() => {
  window.sessionStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('claimSessionOnce', () => {
  it('is true the first time and false afterwards, per key', () => {
    expect(claimSessionOnce('intro')).toBe(true)
    expect(claimSessionOnce('intro')).toBe(false)
    expect(claimSessionOnce('wave')).toBe(true)
    expect(claimSessionOnce('wave')).toBe(false)
  })

  it('starts over with a fresh session (storage cleared)', () => {
    claimSessionOnce('intro')
    window.sessionStorage.clear()
    expect(claimSessionOnce('intro')).toBe(true)
  })

  it('namespaces its key so it cannot collide with app storage', () => {
    claimSessionOnce('intro')
    expect(window.sessionStorage.getItem('intro')).toBeNull()
    expect(window.sessionStorage.length).toBe(1)
  })

  it('is false, and does not throw, when reading storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    expect(claimSessionOnce('intro')).toBe(false)
  })

  it('is false, and does not throw, when writing storage throws (quota, Safari private)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    // If the flag cannot be persisted the intro would replay on every load: skip it instead.
    expect(claimSessionOnce('intro')).toBe(false)
  })

  it('is false, and does not throw, when the sessionStorage getter itself throws', () => {
    vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(claimSessionOnce('intro')).toBe(false)
  })

  it('is false without a window (server)', () => {
    vi.stubGlobal('window', undefined)
    expect(claimSessionOnce('intro')).toBe(false)
  })
})

describe('useOncePerSession', () => {
  function Probe({ k = 'intro' }: { k?: string }) {
    return createElement('span', { 'data-testid': 'p' }, String(useOncePerSession(k)))
  }

  it('is false on the server render', () => {
    expect(renderToString(createElement(Probe))).toContain('false')
    // and the server render must not consume the flag
    expect(window.sessionStorage.length).toBe(0)
  })

  it('becomes true after mount on the first visit in the session', () => {
    const view = render(createElement(Probe))
    expect(view.getByTestId('p').textContent).toBe('true')
  })

  it('is false for a later mount in the same session', () => {
    render(createElement(Probe))
    cleanup()
    const view = render(createElement(Probe))
    expect(view.getByTestId('p').textContent).toBe('false')
  })

  it('survives React StrictMode double-invoked effects without losing the claim', () => {
    const view = render(createElement(StrictMode, null, createElement(Probe)))
    expect(view.getByTestId('p').textContent).toBe('true')
  })

  it('re-evaluates when the key changes', () => {
    const view = render(createElement(Probe, { k: 'a' }))
    expect(view.getByTestId('p').textContent).toBe('true')
    view.rerender(createElement(Probe, { k: 'b' }))
    expect(view.getByTestId('p').textContent).toBe('true')
    view.rerender(createElement(Probe, { k: 'a' }))
    expect(view.getByTestId('p').textContent).toBe('false')
  })

  it('stays false, without throwing, when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('nope')
    })
    const view = render(createElement(Probe))
    expect(view.getByTestId('p').textContent).toBe('false')
  })
})
