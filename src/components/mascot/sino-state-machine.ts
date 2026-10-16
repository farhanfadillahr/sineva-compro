import { SCROLL_LIMITS, clamp } from './sino-math'

// Choreography for the Sino hero (docs/design/mascot-sino.md section 5). The machine decides
// WHICH clip plays and WHEN; it never touches three.js, so every rule is unit tested in plain
// node with fake timers. The runtime feeds it events (pointer hits, clip callbacks, scroll) and
// plays the commands it emits.
//
// Why a hand-written machine and not a library: there are ten triggers and one clip slot, the
// rules are cooldowns and a priority order, and a statechart dependency would cost more bytes in
// the lazy chunk than the logic it replaces.

export type SinoClip =
  | 'idle'
  | 'idle_b'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'greet_wave'
  | 'happy_success'
  | 'wave_small'

export const SINO_TIMING = {
  /** `AnimationAction.crossFadeTo` duration between any two clips. */
  crossfadeS: 0.35,
  /** The hover reaction cannot repeat inside this window. */
  hoverCooldownMs: 4000,
  /** Click on the model and tap on mobile share this cooldown. */
  interactCooldownMs: 5000,
  /** Pointer must rest on the model this long before `listening`. */
  dwellMs: 1500,
  /** The whoa reaction to a scroll flick is limited to once per window. */
  spikeCooldownMs: 3000,
  /** After this long without pointer movement the head returns to the front. */
  stillReturnMs: 4000,
  /** `wave_small` does not exist in the GLB yet; `greet_wave` at this speed stands in for it. */
  reactionTimeScale: 1.25,
} as const

export type SinoEvent =
  | { type: 'firstShown' }
  | { type: 'idleCycle' }
  | { type: 'clipFinished'; clip: SinoClip }
  | { type: 'pointerMove' }
  | { type: 'pointerEnterModel' }
  | { type: 'pointerDwell1500' }
  | { type: 'pointerLeaveModel' }
  | { type: 'clickModel' }
  | { type: 'tap' }
  | { type: 'ctaHover'; active: boolean }
  | { type: 'formFocus'; active: boolean }
  | { type: 'scrollProgress'; progress: number }
  | { type: 'scrollVelocitySpike' }
  | { type: 'heroOut' }
  | { type: 'heroIn' }

export type SinoCommand =
  | { type: 'play'; clip: SinoClip; loop: boolean; timeScale: number; fadeS: number }
  /** `reaction` is the brow raise plus head tilt, `whoa` the brow-up body sway. */
  | { type: 'effect'; effect: 'reaction' | 'whoa' }
  | { type: 'render'; active: boolean }

export type SinoView = {
  /** 1 follows the pointer fully, 0 is the front pose. The runtime eases toward this value. */
  lookWeightTarget: number
  /** Scroll-driven rig targets; the runtime smooths them. */
  scroll: { rotationRad: number; headPitchRad: number }
}

export type SinoMachineOptions = {
  send: (command: SinoCommand) => void
  now?: () => number
  random?: () => number
  /** True the first time this session asks, false after. Backed by sessionStorage in the browser. */
  claimGreeting?: () => boolean
  /** Whether the loaded GLB has a clip of this name. */
  hasClip?: (name: string) => boolean
}

// What kind of one-shot clip is playing decides who may interrupt it. The greeting and the
// celebration are the "moments" and are never cut by a hover; a reaction can be replaced.
type OneShot = 'greet' | 'reaction' | 'celebrate'

export function createSinoMachine(options: SinoMachineOptions) {
  const {
    send,
    now = () => performance.now(),
    random = Math.random,
    claimGreeting = () => false,
    hasClip = () => false,
  } = options

  let clip: SinoClip | null = null
  let oneShot: OneShot | null = null
  let idleVariant: 'idle' | 'idle_b' = 'idle'
  let idleCycles = 0
  let idleCycleTarget = nextCycleTarget()

  let paused = false
  let greeted = false
  let onModel = false
  let dwelled = false
  let ctaActive = false
  let formActive = false
  let dwellTimer: ReturnType<typeof setTimeout> | null = null

  let lastReactionAt = -Infinity
  let lastInteractAt = -Infinity
  let lastSpikeAt = -Infinity
  let lastMoveAt = -Infinity
  let scrollProgress = 0

  // Idle and idle_b swap every 2 or 3 loops, picked at random so the rhythm never feels clocked.
  function nextCycleTarget() {
    return 2 + Math.floor(random() * 2)
  }

  function play(next: SinoClip, kind: OneShot | null, timeScale = 1) {
    clip = next
    oneShot = kind
    send({
      type: 'play',
      clip: next,
      loop: kind === null,
      timeScale,
      fadeS: SINO_TIMING.crossfadeS,
    })
  }

  function baseClip(): SinoClip {
    return (dwelled && onModel) || ctaActive || formActive ? 'listening' : idleVariant
  }

  /** Back to the resting clip. Looping clips that are already right are not restarted. */
  function settle() {
    const target = baseClip()
    if (oneShot === null && clip === target) return
    if (target === 'idle' || target === 'idle_b') {
      idleCycles = 0
      idleCycleTarget = nextCycleTarget()
    }
    play(target, null)
  }

  function clearDwell() {
    if (dwellTimer !== null) clearTimeout(dwellTimer)
    dwellTimer = null
  }

  const isMoment = () => oneShot === 'greet' || oneShot === 'celebrate'

  function handle(event: SinoEvent) {
    // Paused (hero out of view): the only way back is heroIn. Triggers that arrive meanwhile
    // describe a pointer the user can no longer see acting on a model that is not rendering.
    if (paused && event.type !== 'heroIn') return

    switch (event.type) {
      case 'firstShown': {
        if (greeted) return
        greeted = true
        if (claimGreeting()) play('greet_wave', 'greet')
        else play(baseClip(), null)
        return
      }
      case 'idleCycle': {
        if (oneShot !== null || (clip !== 'idle' && clip !== 'idle_b')) return
        idleCycles += 1
        if (idleCycles < idleCycleTarget) return
        idleVariant = idleVariant === 'idle' ? 'idle_b' : 'idle'
        idleCycles = 0
        idleCycleTarget = nextCycleTarget()
        play(idleVariant, null)
        return
      }
      case 'clipFinished': {
        // The mixer reports every finished one-shot; one that was already replaced is stale.
        if (event.clip !== clip || oneShot === null) return
        oneShot = null
        settle()
        return
      }
      case 'pointerMove':
        lastMoveAt = now()
        return
      case 'pointerEnterModel': {
        onModel = true
        clearDwell()
        dwellTimer = setTimeout(() => handle({ type: 'pointerDwell1500' }), SINO_TIMING.dwellMs)
        const t = now()
        if (isMoment() || t - lastReactionAt < SINO_TIMING.hoverCooldownMs) return
        lastReactionAt = t
        if (hasClip('wave_small')) play('wave_small', 'reaction')
        else play('greet_wave', 'reaction', SINO_TIMING.reactionTimeScale)
        send({ type: 'effect', effect: 'reaction' })
        return
      }
      case 'pointerDwell1500': {
        dwellTimer = null
        if (!onModel) return
        dwelled = true
        // A reaction or moment still playing is not cut off: clipFinished settles into listening.
        if (oneShot === null) settle()
        return
      }
      case 'pointerLeaveModel': {
        onModel = false
        dwelled = false
        clearDwell()
        // Only a listening loop is dropped here. A wave that is mid-air finishes (at most 1.6 s)
        // instead of being chopped, and the settle after it lands on idle because dwelled is off.
        if (oneShot === null) settle()
        return
      }
      case 'clickModel':
      case 'tap': {
        const t = now()
        if (t - lastInteractAt < SINO_TIMING.interactCooldownMs) return
        lastInteractAt = t
        if (event.type === 'clickModel') play('happy_success', 'celebrate')
        else play('greet_wave', 'greet')
        return
      }
      case 'ctaHover':
        ctaActive = event.active
        if (oneShot === null) settle()
        return
      case 'formFocus':
        formActive = event.active
        if (oneShot === null) settle()
        return
      case 'scrollProgress':
        scrollProgress = clamp(event.progress, 0, 1)
        return
      case 'scrollVelocitySpike': {
        const t = now()
        if (t - lastSpikeAt < SINO_TIMING.spikeCooldownMs) return
        lastSpikeAt = t
        send({ type: 'effect', effect: 'whoa' })
        return
      }
      case 'heroOut':
        paused = true
        clearDwell()
        send({ type: 'render', active: false })
        return
      case 'heroIn': {
        if (!paused) return
        paused = false
        // Whatever the pointer did while the hero was away is stale; resume calm.
        onModel = false
        dwelled = false
        ctaActive = false
        formActive = false
        send({ type: 'render', active: true })
        // Always restart idle, even if idle was the last clip: the action was stopped with the loop.
        idleVariant = 'idle'
        idleCycles = 0
        idleCycleTarget = nextCycleTarget()
        play('idle', null)
        return
      }
    }
  }

  return {
    dispatch: handle,
    /**
     * Continuous values for the render loop. `nowMs` is passed in (not read here) so the loop can
     * use its own frame timestamp and tests can pin it.
     */
    view(nowMs: number): SinoView {
      const looking = onModel || nowMs - lastMoveAt < SINO_TIMING.stillReturnMs
      return {
        lookWeightTarget: looking ? 1 : 0,
        scroll: {
          rotationRad: SCROLL_LIMITS.rotationRad * scrollProgress,
          headPitchRad: SCROLL_LIMITS.headPitchRad * scrollProgress,
        },
      }
    },
    dispose() {
      clearDwell()
      paused = true
    },
  }
}

export type SinoMachine = ReturnType<typeof createSinoMachine>
