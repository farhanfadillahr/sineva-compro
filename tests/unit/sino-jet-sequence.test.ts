import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSinoMachine, type SinoCommand } from '@/components/mascot/sino-state-machine'
afterEach(() => vi.useRealTimers())
function setup(jets = true) {
  const commands: SinoCommand[] = []
  const machine = createSinoMachine({
    send: (c) => commands.push(c),
    hasClip: () => jets,
    claimGreeting: () => true,
  })
  const last = () => commands.filter((c) => c.type === 'play').at(-1)
  return { machine, last, commands }
}
describe('first show jet sequence', () => {
  it('launches, hovers briefly, lands and greets, then returns to idle', () => {
    vi.useFakeTimers()
    const { machine: m, last } = setup()
    m.dispatch({ type: 'firstShown' })
    expect(last()?.clip).toBe('jet_launch')
    expect(m.view(0).lookWeightTarget).toBe(0)
    m.dispatch({ type: 'clipFinished', clip: 'jet_launch' })
    expect(last()?.clip).toBe('jet_hover')
    vi.advanceTimersByTime(350)
    expect(last()?.clip).toBe('jet_land')
    m.dispatch({ type: 'clipFinished', clip: 'jet_land' })
    expect(last()?.clip).toBe('greet_wave')
    m.dispatch({ type: 'clipFinished', clip: 'greet_wave' })
    expect(last()?.clip).toBe('idle')
    m.dispose()
  })
  it('keeps the v005 greeting when jet clips are unavailable', () => {
    const { machine: m, last } = setup(false)
    m.dispatch({ type: 'firstShown' })
    expect(last()?.clip).toBe('greet_wave')
    m.dispose()
  })
  it('lands at double speed on a click, then replays the queued interaction', () => {
    const { machine: m, last } = setup()
    m.dispatch({ type: 'firstShown' })
    m.dispatch({ type: 'clickModel' })
    expect(last()).toMatchObject({ clip: 'jet_land', timeScale: 2 })
    m.dispatch({ type: 'clipFinished', clip: 'jet_land' })
    m.dispatch({ type: 'clipFinished', clip: 'greet_wave' })
    expect(last()?.clip).toBe('happy_success')
    m.dispose()
  })
  it('cancels a flight when hidden and returns calmly on re-entry', () => {
    const { machine: m, last } = setup()
    m.dispatch({ type: 'firstShown' })
    m.dispatch({ type: 'heroOut' })
    m.dispatch({ type: 'heroIn' })
    expect(last()?.clip).toBe('idle')
    expect(m.view(0).airborne).toBe(false)
    m.dispose()
  })
})
