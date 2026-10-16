// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { joinStaggerBatch } from '../../src/lib/motion/stagger-batch'

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

function items(n: number) {
  document.body.innerHTML = `<ul>${Array.from({ length: n }, (_, i) => `<li id="i${i}"></li>`).join('')}</ul>`
  return Array.from(document.querySelectorAll<HTMLElement>('li'))
}

const at = (list: HTMLElement[], i: number) => list[i]!

describe('joinStaggerBatch', () => {
  it('staggers elements that become visible together, in document order, 60 ms apart', () => {
    const list = items(3)
    const a = at(list, 0)
    const b = at(list, 1)
    const c = at(list, 2)
    const got: Record<string, number> = {}
    // Joined out of order on purpose: IntersectionObserver callbacks follow observer creation.
    joinStaggerBatch(c, (d) => (got.c = d))
    joinStaggerBatch(a, (d) => (got.a = d))
    joinStaggerBatch(b, (d) => (got.b = d))
    expect(got).toEqual({})
    vi.runAllTimers()
    expect(got).toEqual({ a: 0, b: 60, c: 120 })
  })

  it('gives a lone element no delay, so a card entering by itself does not wait', () => {
    const list = items(1)
    const a = at(list, 0)
    const apply = vi.fn()
    joinStaggerBatch(a, apply)
    vi.runAllTimers()
    expect(apply).toHaveBeenCalledWith(0)
  })

  it('caps the stagger at the sixth item', () => {
    const els = items(9)
    const got: number[] = []
    els.forEach((el, i) => joinStaggerBatch(el, (d) => (got[i] = d)))
    vi.runAllTimers()
    expect(got).toEqual([0, 60, 120, 180, 240, 300, 300, 300, 300])
  })

  it('starts a fresh batch for elements that arrive later', () => {
    const list = items(2)
    const a = at(list, 0)
    const b = at(list, 1)
    const got: Record<string, number> = {}
    joinStaggerBatch(a, (d) => (got.a = d))
    vi.runAllTimers()
    joinStaggerBatch(b, (d) => (got.b = d))
    vi.runAllTimers()
    expect(got).toEqual({ a: 0, b: 0 })
  })

  it('cancel removes an element from its batch (unmount before the flush)', () => {
    const list = items(2)
    const a = at(list, 0)
    const b = at(list, 1)
    const applyA = vi.fn()
    const applyB = vi.fn()
    const cancelA = joinStaggerBatch(a, applyA)
    joinStaggerBatch(b, applyB)
    cancelA()
    vi.runAllTimers()
    expect(applyA).not.toHaveBeenCalled()
    expect(applyB).toHaveBeenCalledWith(0)
  })
})
