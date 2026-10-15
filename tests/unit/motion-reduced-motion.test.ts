// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { createElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { prefersReducedMotion, usePrefersReducedMotion } from '../../src/lib/motion/reduced-motion'
import { installMatchMedia, removeMatchMedia } from './motion-test-utils'

afterEach(() => {
  cleanup()
  removeMatchMedia()
})

describe('prefersReducedMotion()', () => {
  it('is false when matchMedia does not exist', () => {
    removeMatchMedia()
    expect(prefersReducedMotion()).toBe(false)
  })

  it('queries the reduce media feature', () => {
    installMatchMedia(true)
    expect(prefersReducedMotion()).toBe(true)
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
  })

  it('is false when the user has no preference', () => {
    installMatchMedia(false)
    expect(prefersReducedMotion()).toBe(false)
  })
})

describe('usePrefersReducedMotion()', () => {
  it('returns false on the server, whatever the client preference would be', () => {
    function Probe() {
      return createElement('span', null, String(usePrefersReducedMotion()))
    }
    // renderToString runs in jsdom but uses the server snapshot, like SSR does.
    installMatchMedia(true)
    expect(renderToString(createElement(Probe))).toContain('false')
  })

  it('reads the client preference after mount', () => {
    installMatchMedia(true)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(true)
  })

  it('reacts to the preference changing while mounted', () => {
    const media = installMatchMedia(false)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
    act(() => media.set(true))
    expect(result.current).toBe(true)
    act(() => media.set(false))
    expect(result.current).toBe(false)
  })

  it('removes its listener on unmount', () => {
    const media = installMatchMedia(false)
    const { unmount } = renderHook(() => usePrefersReducedMotion())
    expect(media.listenerCount()).toBe(1)
    unmount()
    expect(media.listenerCount()).toBe(0)
  })

  it('does not throw without matchMedia', () => {
    removeMatchMedia()
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
  })
})

describe('reduced motion decision lives in one module', () => {
  it('is the only place that spells the media query', async () => {
    const { existsSync, readdirSync, readFileSync, statSync } = await import('node:fs')
    const { join } = await import('node:path')
    // Scoped to the motion folders so unrelated features are free to evolve.
    const root = process.cwd()
    const hits: string[] = []
    const walk = (dir: string) => {
      if (!existsSync(dir)) return
      for (const name of readdirSync(dir)) {
        const p = join(dir, name)
        if (statSync(p).isDirectory()) walk(p)
        else if (
          /\.(ts|tsx)$/.test(name) &&
          readFileSync(p, 'utf8').includes('prefers-reduced-motion')
        )
          hits.push(p.replace(root + '/', ''))
      }
    }
    walk(join(root, 'src/lib/motion'))
    walk(join(root, 'src/components/motion'))
    expect(hits).toEqual(['src/lib/motion/reduced-motion.ts'])
  })
})
