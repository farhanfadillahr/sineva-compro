import { describe, expect, it } from 'vitest'
import { chatTimeline, CHAT_TIMING } from '@/components/sections/_internal/chat-sequence'

describe('chatTimeline', () => {
  const ask = { from: 'user' as const }
  const reply = { from: 'sino' as const }

  it('shows the request, then Sino typing, then the reply, then holds before the loop restarts', () => {
    const steps = chatTimeline([ask, reply])
    expect(steps.map((s) => [s.shown, s.typing])).toEqual([
      [0, false],
      [1, false],
      [1, true],
      [2, false],
    ])
    expect(steps[0]!.at).toBe(0)
    // every step is later than the one before
    steps.slice(1).forEach((s, i) => expect(s.at).toBeGreaterThan(steps[i]!.at))
  })

  it('types before every Sino bubble only', () => {
    const steps = chatTimeline([ask, reply, ask, reply])
    expect(steps.filter((s) => s.typing).map((s) => s.shown)).toEqual([1, 3])
  })

  it('reports a loop length that leaves the finished chat on screen for the hold time', () => {
    const steps = chatTimeline([ask, reply])
    const last = steps[steps.length - 1]!
    expect(CHAT_TIMING.loopLength(steps)).toBe(last.at + CHAT_TIMING.holdMs)
  })

  it('is empty for no bubbles', () => {
    expect(chatTimeline([])).toEqual([])
  })
})
