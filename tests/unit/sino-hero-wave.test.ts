import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSinoMachine, type SinoCommand } from '@/components/mascot/sino-state-machine'

// Product-owner decision (2026-10-16): the hero Sino only waves. The jetpack launch belongs to the
// first-visit splash (a pre-rendered video, see logo-intro-launch.test.tsx). The GLB still carries
// the jet clips, so these tests run the machine with a GLB that has them and prove it ignores them.
afterEach(() => vi.useRealTimers())

const GLB_CLIPS = [
  'idle',
  'idle_b',
  'listening',
  'thinking',
  'speaking',
  'greet_wave',
  'happy_success',
  'jet_launch',
  'jet_hover',
  'jet_land',
]

function setup() {
  const commands: SinoCommand[] = []
  const machine = createSinoMachine({
    send: (c) => commands.push(c),
    hasClip: (name) => GLB_CLIPS.includes(name),
    claimGreeting: () => true,
    random: () => 0,
  })
  const clips = () => commands.flatMap((c) => (c.type === 'play' ? [c.clip] : []))
  return { machine, clips, commands }
}

describe('hero first show (wave, then idle)', () => {
  it('plays greet_wave once and then idle, even when the GLB carries the jet clips', () => {
    const { machine, clips } = setup()
    machine.dispatch({ type: 'firstShown' })
    expect(clips()).toEqual(['greet_wave'])
    machine.dispatch({ type: 'clipFinished', clip: 'greet_wave' })
    expect(clips()).toEqual(['greet_wave', 'idle'])
    machine.dispose()
  })

  it('never plays a jet clip, whatever the visitor does during the first wave', () => {
    const { machine, clips } = setup()
    machine.dispatch({ type: 'firstShown' })
    machine.dispatch({ type: 'clickModel' })
    machine.dispatch({ type: 'tap' })
    machine.dispatch({ type: 'pointerEnterModel' })
    machine.dispatch({ type: 'scrollVelocitySpike' })
    machine.dispatch({ type: 'clipFinished', clip: 'greet_wave' })
    machine.dispatch({ type: 'heroOut' })
    machine.dispatch({ type: 'heroIn' })
    expect(clips().filter((clip) => clip.startsWith('jet_'))).toEqual([])
    machine.dispose()
  })

  it('keeps look-at and the scroll rig live while waving (nothing is airborne)', () => {
    const { machine } = setup()
    machine.dispatch({ type: 'firstShown' })
    machine.dispatch({ type: 'pointerMove' })
    machine.dispatch({ type: 'scrollProgress', progress: 1 })
    const view = machine.view(performance.now())
    expect(view).not.toHaveProperty('airborne')
    expect(view.lookWeightTarget).toBe(1)
    expect(view.scroll.rotationRad).toBeGreaterThan(0)
    machine.dispose()
  })
})

describe('the realtime jet code is gone from the hero', () => {
  const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')

  it('has no jet effects module and the runtime and machine never mention the jet', () => {
    expect(existsSync(join(process.cwd(), 'src/components/mascot/sino-jet-effects.ts'))).toBe(false)
    for (const file of [
      'src/components/mascot/sino-runtime.ts',
      'src/components/mascot/sino-state-machine.ts',
      'src/components/mascot/sino-look.ts',
    ]) {
      expect(read(file), file).not.toMatch(/jet|airborne|skipFlight/i)
    }
  })
})
