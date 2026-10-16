// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { createElement, useRef } from 'react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadGsap, useGsapContext } from '../../src/lib/motion/gsap'
import { flush, installMatchMedia, removeMatchMedia } from './motion-test-utils'

const h = vi.hoisted(() => {
  const ctx = { revert: vi.fn(), kill: vi.fn() }
  return {
    gsapFactoryRuns: 0,
    scrollTriggerFactoryRuns: 0,
    registerPlugin: vi.fn(),
    context: vi.fn((fn: () => void, scope?: Element) => {
      void scope
      fn()
      return ctx
    }),
    ctx,
    getAll: vi.fn(() => [] as Array<{ trigger?: Element; kill: () => void }>),
  }
})

vi.mock('gsap', () => {
  h.gsapFactoryRuns++
  const gsap = { registerPlugin: h.registerPlugin, context: h.context }
  return { gsap, default: gsap }
})

vi.mock('gsap/ScrollTrigger', () => {
  h.scrollTriggerFactoryRuns++
  const ScrollTrigger = { getAll: h.getAll }
  return { ScrollTrigger, default: ScrollTrigger }
})

// The loader memoises its promise for the life of the module, so these suites run in order:
// reduced motion first (must not import anything), then failure and retry, then the shared bundle.
beforeEach(() => {
  installMatchMedia(false)
})

afterEach(() => {
  cleanup()
  removeMatchMedia()
})

describe('loadGsap: reduced motion', () => {
  it('resolves null and never imports gsap or ScrollTrigger', async () => {
    installMatchMedia(true)
    await expect(loadGsap()).resolves.toBeNull()
    await flush()
    expect(h.gsapFactoryRuns).toBe(0)
    expect(h.scrollTriggerFactoryRuns).toBe(0)
  })
})

describe('loadGsap: loading', () => {
  it('does not import anything until called', () => {
    expect(h.gsapFactoryRuns).toBe(0)
  })

  it('retries after a failed load instead of caching the rejection', async () => {
    h.registerPlugin.mockImplementationOnce(() => {
      throw new Error('boom')
    })
    await expect(loadGsap()).rejects.toThrow('boom')
    const bundle = await loadGsap()
    expect(bundle?.gsap).toBeDefined()
    // once for the attempt that threw, once for the retry that succeeded
    expect(h.registerPlugin).toHaveBeenCalledTimes(2)
    expect(h.registerPlugin).toHaveBeenLastCalledWith(bundle?.ScrollTrigger)
  })

  it('imports each module once and shares one bundle across callers', async () => {
    h.registerPlugin.mockClear()
    const [a, b] = await Promise.all([loadGsap(), loadGsap()])
    expect(a).toBe(b)
    expect(a?.ScrollTrigger.getAll).toBe(h.getAll)
    expect(h.gsapFactoryRuns).toBe(1)
    expect(h.scrollTriggerFactoryRuns).toBe(1)
    expect(h.registerPlugin).not.toHaveBeenCalled()
  })

  it('keeps gsap out of static imports so it stays in a lazy chunk', () => {
    const src = readFileSync(join(process.cwd(), 'src/lib/motion/gsap.ts'), 'utf8')
    expect(src).not.toMatch(/^import\s+(?!type\b)[^;]*from\s+['"]gsap/m)
    expect(src).toMatch(/import\(\s*['"]gsap['"]\s*\)/)
    expect(src).toMatch(/import\(\s*['"]gsap\/ScrollTrigger['"]\s*\)/)
  })
})

describe('useGsapContext', () => {
  function Host(props: { setup: Parameters<typeof useGsapContext>[1] }) {
    const ref = useRef<HTMLDivElement>(null)
    useGsapContext(ref, props.setup)
    return createElement('div', { ref, 'data-testid': 'scope' }, 'content')
  }

  beforeEach(() => {
    h.ctx.revert.mockClear()
    h.ctx.kill.mockClear()
    h.context.mockClear()
    h.getAll.mockReset()
    h.getAll.mockReturnValue([])
  })

  it('runs setup inside gsap.context scoped to the element, after mount', async () => {
    const setup = vi.fn()
    const view = render(createElement(Host, { setup }))
    expect(setup).not.toHaveBeenCalled()
    await flush()
    expect(setup).toHaveBeenCalledTimes(1)
    expect(h.context).toHaveBeenCalledTimes(1)
    expect(h.context.mock.calls[0][1]).toBe(view.getByTestId('scope'))
    const [bundle] = setup.mock.calls[0]
    expect(bundle.gsap).toBeDefined()
    expect(bundle.ScrollTrigger).toBeDefined()
  })

  it('reverts the context and calls the setup cleanup on unmount', async () => {
    const cleanupFn = vi.fn()
    const view = render(createElement(Host, { setup: () => cleanupFn }))
    await flush()
    view.unmount()
    expect(cleanupFn).toHaveBeenCalledTimes(1)
    expect(h.ctx.revert).toHaveBeenCalledTimes(1)
    expect(h.ctx.kill).toHaveBeenCalledTimes(1)
  })

  it('kills ScrollTriggers left inside the scope, and only those', async () => {
    const view = render(createElement(Host, { setup: () => {} }))
    await flush()
    const scope = view.getByTestId('scope')
    const inside = { trigger: scope.firstElementChild ?? scope, kill: vi.fn() }
    const outside = { trigger: document.body, kill: vi.fn() }
    const triggerless = { kill: vi.fn() }
    h.getAll.mockReturnValue([inside, outside, triggerless])
    view.unmount()
    expect(inside.kill).toHaveBeenCalledTimes(1)
    expect(outside.kill).not.toHaveBeenCalled()
    expect(triggerless.kill).not.toHaveBeenCalled()
  })

  it('never runs setup if unmounted before the lazy load resolves', async () => {
    const setup = vi.fn()
    const view = render(createElement(Host, { setup }))
    view.unmount()
    await flush()
    expect(setup).not.toHaveBeenCalled()
    expect(h.context).not.toHaveBeenCalled()
  })

  it('skips setup entirely under reduced motion', async () => {
    installMatchMedia(true)
    const setup = vi.fn()
    render(createElement(Host, { setup }))
    await flush()
    expect(setup).not.toHaveBeenCalled()
    expect(h.context).not.toHaveBeenCalled()
  })
})
