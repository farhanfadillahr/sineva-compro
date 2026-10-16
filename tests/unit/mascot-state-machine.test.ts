import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  SINO_TIMING,
  createSinoMachine,
  type SinoCommand,
  type SinoEvent,
} from '@/components/mascot/sino-state-machine'

// The machine is pure (no three import): it turns triggers into commands the runtime plays. Time
// comes from an injected clock that follows vitest's fake Date, and the dwell timer is a real
// setTimeout, so `vi.advanceTimersByTime` moves both together.

type Harness = ReturnType<typeof setup>

function setup(
  options: { claimGreeting?: () => boolean; clips?: readonly string[]; random?: () => number } = {},
) {
  const commands: SinoCommand[] = []
  const machine = createSinoMachine({
    send: (command) => commands.push(command),
    now: () => Date.now(),
    random: options.random ?? (() => 0),
    claimGreeting: options.claimGreeting ?? (() => true),
    hasClip: (name) => (options.clips ?? ['idle', 'idle_b', 'listening']).includes(name),
  })
  const plays = () =>
    commands.filter((c): c is Extract<SinoCommand, { type: 'play' }> => c.type === 'play')
  const lastPlay = () => plays().at(-1)
  const effects = () =>
    commands.filter((c): c is Extract<SinoCommand, { type: 'effect' }> => c.type === 'effect')
  const send = (event: SinoEvent) => machine.dispatch(event)
  return { machine, commands, plays, lastPlay, effects, send }
}

/** A machine that already finished its greeting and sits in idle, so each test starts calm. */
function settled(options?: Parameters<typeof setup>[0]): Harness {
  const harness = setup({ claimGreeting: () => false, ...options })
  harness.send({ type: 'firstShown' })
  // Far enough from t=0 that no cooldown is still running.
  vi.advanceTimersByTime(60_000)
  harness.commands.length = 0
  return harness
}

const deg = (rad: number) => (rad * 180) / Math.PI

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-16T00:00:00Z'))
})
afterEach(() => {
  vi.useRealTimers()
})

describe('firstShown (greet once per session)', () => {
  it('plays greet_wave once, then idle when it finishes, on the first claim of the session', () => {
    const h = setup({ claimGreeting: () => true })
    h.send({ type: 'firstShown' })
    expect(h.lastPlay()).toMatchObject({ clip: 'greet_wave', loop: false, fadeS: 0.35 })
    h.send({ type: 'clipFinished', clip: 'greet_wave' })
    expect(h.lastPlay()).toMatchObject({ clip: 'idle', loop: true })
  })

  it('goes straight to idle when the session already greeted', () => {
    const h = setup({ claimGreeting: () => false })
    h.send({ type: 'firstShown' })
    expect(h.plays().map((c) => c.clip)).toEqual(['idle'])
  })

  it('asks the session for the greeting once, even if firstShown arrives twice', () => {
    const claim = vi.fn(() => true)
    const h = setup({ claimGreeting: claim })
    h.send({ type: 'firstShown' })
    h.send({ type: 'firstShown' })
    expect(claim).toHaveBeenCalledTimes(1)
    expect(h.plays().filter((c) => c.clip === 'greet_wave')).toHaveLength(1)
  })

  it('ignores a clipFinished event for a clip that is no longer current', () => {
    const h = setup({ claimGreeting: () => true })
    h.send({ type: 'firstShown' })
    h.send({ type: 'clipFinished', clip: 'happy_success' })
    expect(h.plays()).toHaveLength(1)
  })
})

describe('idleCycle (idle and idle_b alternate every 2 to 3 cycles)', () => {
  it('swaps to idle_b after 2 cycles when random picks the short run', () => {
    const h = settled({ random: () => 0 })
    h.send({ type: 'idleCycle' })
    expect(h.plays()).toHaveLength(0)
    h.send({ type: 'idleCycle' })
    expect(h.lastPlay()).toMatchObject({ clip: 'idle_b', loop: true })
  })

  it('waits for 3 cycles when random picks the long run', () => {
    const h = settled({ random: () => 0.99 })
    h.send({ type: 'idleCycle' })
    h.send({ type: 'idleCycle' })
    expect(h.plays()).toHaveLength(0)
    h.send({ type: 'idleCycle' })
    expect(h.lastPlay()?.clip).toBe('idle_b')
  })

  it('alternates back to idle on the next run', () => {
    const h = settled({ random: () => 0 })
    for (let i = 0; i < 4; i += 1) h.send({ type: 'idleCycle' })
    expect(h.plays().map((c) => c.clip)).toEqual(['idle_b', 'idle'])
  })

  it('does not count cycles while a non-idle clip plays', () => {
    const h = settled({ random: () => 0 })
    h.send({ type: 'ctaHover', active: true })
    h.commands.length = 0
    h.send({ type: 'idleCycle' })
    h.send({ type: 'idleCycle' })
    expect(h.plays()).toHaveLength(0)
  })
})

describe('pointerEnterModel (reaction, 4 s cooldown)', () => {
  it('reacts with greet_wave at 1.25x when wave_small is missing, plus a brow and tilt effect', () => {
    const h = settled()
    h.send({ type: 'pointerEnterModel' })
    expect(h.lastPlay()).toMatchObject({
      clip: 'greet_wave',
      loop: false,
      timeScale: SINO_TIMING.reactionTimeScale,
      fadeS: 0.35,
    })
    expect(SINO_TIMING.reactionTimeScale).toBe(1.25)
    expect(h.effects()).toEqual([{ type: 'effect', effect: 'reaction' }])
  })

  it('prefers wave_small at normal speed when the clip exists', () => {
    const h = settled({ clips: ['idle', 'idle_b', 'listening', 'wave_small'] })
    h.send({ type: 'pointerEnterModel' })
    expect(h.lastPlay()).toMatchObject({ clip: 'wave_small', timeScale: 1 })
  })

  it('does not react again inside the 4 s cooldown, then reacts after it', () => {
    const h = settled()
    h.send({ type: 'pointerEnterModel' })
    h.send({ type: 'pointerLeaveModel' })
    h.commands.length = 0
    vi.advanceTimersByTime(3_900)
    h.send({ type: 'pointerEnterModel' })
    expect(h.effects()).toHaveLength(0)
    h.send({ type: 'pointerLeaveModel' })
    vi.advanceTimersByTime(200)
    h.send({ type: 'pointerEnterModel' })
    expect(h.effects()).toHaveLength(1)
  })

  it('returns to idle when the reaction clip finishes', () => {
    const h = settled()
    h.send({ type: 'pointerEnterModel' })
    h.send({ type: 'clipFinished', clip: 'greet_wave' })
    expect(h.lastPlay()).toMatchObject({ clip: 'idle', loop: true })
  })

  it('holds eye contact while the pointer stays on the model, even when it stops moving', () => {
    const h = settled()
    h.send({ type: 'pointerMove' })
    h.send({ type: 'pointerEnterModel' })
    vi.advanceTimersByTime(10_000)
    expect(h.machine.view(Date.now()).lookWeightTarget).toBe(1)
  })

  it('does not interrupt the once-per-session greeting', () => {
    const h = setup({ claimGreeting: () => true })
    h.send({ type: 'firstShown' })
    h.commands.length = 0
    h.send({ type: 'pointerEnterModel' })
    expect(h.plays()).toHaveLength(0)
  })
})

describe('pointerDwell1500 (listening) and pointerLeaveModel (back to idle)', () => {
  it('plays listening after the pointer rests on the model for 1.5 s', () => {
    const h = settled()
    h.send({ type: 'pointerEnterModel' })
    h.send({ type: 'clipFinished', clip: 'greet_wave' })
    h.commands.length = 0
    vi.advanceTimersByTime(SINO_TIMING.dwellMs - 1)
    expect(h.plays()).toHaveLength(0)
    vi.advanceTimersByTime(1)
    expect(h.lastPlay()).toMatchObject({ clip: 'listening', loop: true })
    expect(SINO_TIMING.dwellMs).toBe(1500)
  })

  it('waits for the reaction to finish before listening, instead of cutting it off', () => {
    const h = settled()
    h.send({ type: 'pointerEnterModel' })
    h.commands.length = 0
    vi.advanceTimersByTime(1_500)
    expect(h.plays()).toHaveLength(0)
    h.send({ type: 'clipFinished', clip: 'greet_wave' })
    expect(h.lastPlay()?.clip).toBe('listening')
  })

  it('cancels the dwell when the pointer leaves early', () => {
    const h = settled()
    h.send({ type: 'pointerEnterModel' })
    h.send({ type: 'clipFinished', clip: 'greet_wave' })
    h.commands.length = 0
    vi.advanceTimersByTime(1_000)
    h.send({ type: 'pointerLeaveModel' })
    vi.advanceTimersByTime(5_000)
    expect(h.plays()).toHaveLength(0)
  })

  it('returns to idle with a 0.35 s crossfade when the pointer leaves during listening', () => {
    const h = settled()
    h.send({ type: 'pointerEnterModel' })
    h.send({ type: 'clipFinished', clip: 'greet_wave' })
    vi.advanceTimersByTime(1_500)
    h.commands.length = 0
    h.send({ type: 'pointerLeaveModel' })
    expect(h.lastPlay()).toMatchObject({ clip: 'idle', loop: true, fadeS: 0.35 })
  })

  it('lets a reaction wave finish after the pointer leaves instead of cutting it', () => {
    const h = settled()
    h.send({ type: 'pointerEnterModel' })
    h.commands.length = 0
    h.send({ type: 'pointerLeaveModel' })
    expect(h.plays()).toHaveLength(0)
  })

  it('looks away once the pointer has left the model and stayed still for 4 s', () => {
    const h = settled()
    h.send({ type: 'pointerMove' })
    h.send({ type: 'pointerEnterModel' })
    h.send({ type: 'pointerLeaveModel' })
    expect(h.machine.view(Date.now()).lookWeightTarget).toBe(1)
    vi.advanceTimersByTime(4_001)
    expect(h.machine.view(Date.now()).lookWeightTarget).toBe(0)
  })
})

describe('clickModel (happy_success, 5 s cooldown)', () => {
  it('plays happy_success once and returns to idle when it finishes', () => {
    const h = settled()
    h.send({ type: 'clickModel' })
    expect(h.lastPlay()).toMatchObject({ clip: 'happy_success', loop: false })
    h.send({ type: 'clipFinished', clip: 'happy_success' })
    expect(h.lastPlay()?.clip).toBe('idle')
  })

  it('ignores a second click inside 5 s and accepts one after it', () => {
    const h = settled()
    h.send({ type: 'clickModel' })
    vi.advanceTimersByTime(4_999)
    h.send({ type: 'clickModel' })
    expect(h.plays().filter((c) => c.clip === 'happy_success')).toHaveLength(1)
    vi.advanceTimersByTime(1)
    h.send({ type: 'clickModel' })
    expect(h.plays().filter((c) => c.clip === 'happy_success')).toHaveLength(2)
  })

  it('is not interrupted by a hover reaction while it plays', () => {
    const h = settled()
    h.send({ type: 'clickModel' })
    h.commands.length = 0
    h.send({ type: 'pointerEnterModel' })
    expect(h.plays()).toHaveLength(0)
  })

  it('goes back to listening, not idle, when the pointer is still on the model after it', () => {
    const h = settled()
    h.send({ type: 'pointerEnterModel' })
    h.send({ type: 'clipFinished', clip: 'greet_wave' })
    vi.advanceTimersByTime(1_500)
    h.send({ type: 'clickModel' })
    h.send({ type: 'clipFinished', clip: 'happy_success' })
    expect(h.lastPlay()?.clip).toBe('listening')
  })
})

describe('tap (mobile greet, 5 s cooldown)', () => {
  it('plays greet_wave at normal speed and respects the cooldown', () => {
    const h = settled()
    h.send({ type: 'tap' })
    expect(h.lastPlay()).toMatchObject({ clip: 'greet_wave', timeScale: 1, loop: false })
    h.send({ type: 'clipFinished', clip: 'greet_wave' })
    vi.advanceTimersByTime(2_000)
    h.commands.length = 0
    h.send({ type: 'tap' })
    expect(h.plays()).toHaveLength(0)
    vi.advanceTimersByTime(3_000)
    h.send({ type: 'tap' })
    expect(h.lastPlay()?.clip).toBe('greet_wave')
  })

  it('shares the cooldown with click so the two cannot be chained', () => {
    const h = settled()
    h.send({ type: 'clickModel' })
    h.send({ type: 'clipFinished', clip: 'happy_success' })
    h.commands.length = 0
    h.send({ type: 'tap' })
    expect(h.plays()).toHaveLength(0)
  })
})

describe('ctaHover and form focus (listening)', () => {
  it('plays listening while the CTA is hovered and returns to idle when the hover ends', () => {
    const h = settled()
    h.send({ type: 'ctaHover', active: true })
    expect(h.lastPlay()).toMatchObject({ clip: 'listening', loop: true })
    h.send({ type: 'ctaHover', active: false })
    expect(h.lastPlay()?.clip).toBe('idle')
  })

  it('keeps listening when the pointer leaves the model while the CTA is hovered', () => {
    const h = settled()
    h.send({ type: 'ctaHover', active: true })
    h.commands.length = 0
    h.send({ type: 'pointerLeaveModel' })
    expect(h.plays()).toHaveLength(0)
  })

  it('plays listening on form focus and returns to idle on blur', () => {
    const h = settled()
    h.send({ type: 'formFocus', active: true })
    expect(h.lastPlay()?.clip).toBe('listening')
    h.send({ type: 'formFocus', active: false })
    expect(h.lastPlay()?.clip).toBe('idle')
  })

  it('does not restart listening when it is already playing', () => {
    const h = settled()
    h.send({ type: 'ctaHover', active: true })
    h.send({ type: 'formFocus', active: true })
    expect(h.plays().filter((c) => c.clip === 'listening')).toHaveLength(1)
  })
})

describe('scrollProgress (rig follows the scroll)', () => {
  it('maps 0..1 to a rotation up to 20 degrees and a head pitch up to 8 degrees', () => {
    const h = settled()
    expect(h.machine.view(Date.now()).scroll).toEqual({ rotationRad: 0, headPitchRad: 0 })
    h.send({ type: 'scrollProgress', progress: 1 })
    const { rotationRad, headPitchRad } = h.machine.view(Date.now()).scroll
    expect(deg(rotationRad)).toBeCloseTo(20, 6)
    expect(deg(headPitchRad)).toBeCloseTo(8, 6)
  })

  it('is linear in between and clamps out-of-range progress', () => {
    const h = settled()
    h.send({ type: 'scrollProgress', progress: 0.5 })
    expect(deg(h.machine.view(0).scroll.rotationRad)).toBeCloseTo(10, 6)
    h.send({ type: 'scrollProgress', progress: 7 })
    expect(deg(h.machine.view(0).scroll.rotationRad)).toBeCloseTo(20, 6)
    h.send({ type: 'scrollProgress', progress: -3 })
    expect(h.machine.view(0).scroll.rotationRad).toBe(0)
  })

  it('does not change the playing clip', () => {
    const h = settled()
    h.send({ type: 'scrollProgress', progress: 0.6 })
    expect(h.commands).toHaveLength(0)
  })
})

describe('scrollVelocitySpike (brow sway, at most once per 3 s)', () => {
  it('emits the whoa effect, then ignores spikes for 3 s', () => {
    const h = settled()
    h.send({ type: 'scrollVelocitySpike' })
    expect(h.effects()).toEqual([{ type: 'effect', effect: 'whoa' }])
    vi.advanceTimersByTime(2_999)
    h.send({ type: 'scrollVelocitySpike' })
    expect(h.effects()).toHaveLength(1)
    vi.advanceTimersByTime(1)
    h.send({ type: 'scrollVelocitySpike' })
    expect(h.effects()).toHaveLength(2)
  })
})

describe('heroOut and heroIn (pause and resume)', () => {
  it('stops rendering on heroOut and ignores triggers while out', () => {
    const h = settled()
    h.send({ type: 'heroOut' })
    expect(h.commands).toContainEqual({ type: 'render', active: false })
    h.commands.length = 0
    h.send({ type: 'pointerEnterModel' })
    h.send({ type: 'clickModel' })
    h.send({ type: 'ctaHover', active: true })
    expect(h.commands).toHaveLength(0)
  })

  it('cancels a pending dwell timer on heroOut', () => {
    const h = settled()
    h.send({ type: 'pointerEnterModel' })
    h.send({ type: 'clipFinished', clip: 'greet_wave' })
    h.send({ type: 'heroOut' })
    h.commands.length = 0
    vi.advanceTimersByTime(5_000)
    expect(h.commands).toHaveLength(0)
  })

  it('resumes rendering with idle on heroIn, dropping stale hover state', () => {
    const h = settled()
    h.send({ type: 'ctaHover', active: true })
    h.send({ type: 'heroOut' })
    h.commands.length = 0
    h.send({ type: 'heroIn' })
    expect(h.commands).toEqual([
      { type: 'render', active: true },
      { type: 'play', clip: 'idle', loop: true, timeScale: 1, fadeS: 0.35 },
    ])
  })
})

describe('dispose', () => {
  it('clears the dwell timer so nothing fires after unmount', () => {
    const h = settled()
    h.send({ type: 'pointerEnterModel' })
    h.send({ type: 'clipFinished', clip: 'greet_wave' })
    h.commands.length = 0
    h.machine.dispose()
    vi.advanceTimersByTime(5_000)
    expect(h.commands).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)
  })
})
