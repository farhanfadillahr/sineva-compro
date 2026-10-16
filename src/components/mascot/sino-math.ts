// Pure numeric helpers for the Sino hero. No three.js import on purpose: they are unit tested in
// plain node and the state machine shares the scroll constants, so neither drags the 3D library
// into a bundle that only needs numbers.

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const degToRad = (degrees: number) => (degrees * Math.PI) / 180

/** Look-at limits from mascot-sino.md section 5. Eyes turn an extra `eyeRatio` of the head angle. */
export const LOOK_LIMITS = {
  yawRad: degToRad(25),
  pitchRad: degToRad(15),
  eyeRatio: 0.6,
} as const

/** Look-at smoothing: lerp 0.08 per frame at 60 fps (mascot-sino.md section 5). */
export const LOOK_LERP = 0.08

/** Scroll-linked rig motion limits (mascot-sino.md section 5). */
export const SCROLL_LIMITS = {
  rotationRad: degToRad(20),
  headPitchRad: degToRad(8),
  /** The canvas moves up at 0.85x the page speed. */
  parallax: 0.85,
} as const

/** Scroll speed (px/s) above which a flick counts as a spike. A fast trackpad scroll peaks near 2500. */
const SCROLL_SPIKE_PX_PER_S = 3000

/**
 * Per-frame lerp factor that behaves the same at any frame rate. A plain `lerp(a, b, 0.08)` is
 * 0.08 at 60 fps but twice as slow in real time at 120 fps; this returns exactly `base` at 60 fps
 * and compounds correctly for other frame times. `dt` is capped so a tab that wakes after a long
 * pause eases in instead of snapping.
 */
export function dampFactor(base: number, dtSeconds: number): number {
  const dt = Math.min(Math.max(dtSeconds, 0), 0.1)
  return 1 - Math.pow(1 - base, dt * 60)
}

export type LookAngles = { yaw: number; pitch: number }

/**
 * Head and eye rotation for a wanted look direction. The head is clamped to the limits and scaled
 * by `weight` (0 is the front pose, 1 is full eye contact); the eyes add `eyeRatio` of the head
 * angle on top, since their bones sit inside the head.
 */
export function headFollowAngles(
  wanted: LookAngles,
  weight: number,
): { head: LookAngles; eyes: LookAngles } {
  const w = clamp(weight, 0, 1)
  const head = {
    yaw: clamp(wanted.yaw, -LOOK_LIMITS.yawRad, LOOK_LIMITS.yawRad) * w,
    pitch: clamp(wanted.pitch, -LOOK_LIMITS.pitchRad, LOOK_LIMITS.pitchRad) * w,
  }
  return {
    head,
    eyes: { yaw: head.yaw * LOOK_LIMITS.eyeRatio, pitch: head.pitch * LOOK_LIMITS.eyeRatio },
  }
}

/**
 * 0 when the hero's top is at the viewport top, 1 once the page has scrolled one hero height.
 * `heroTop` is the hero's offset from the top of the document, so the value does not depend on
 * where the hero happens to sit on the page.
 */
export function heroScrollProgress(scrollY: number, heroTop: number, heroHeight: number): number {
  if (heroHeight <= 0) return 1
  return clamp((scrollY - heroTop) / heroHeight, 0, 1)
}

/** How far down (px) the rig is pushed so the canvas appears to move at 0.85x the scroll speed. */
export function parallaxOffsetPx(scrolledPx: number): number {
  return Math.max(0, scrolledPx) * (1 - SCROLL_LIMITS.parallax)
}

export function isScrollSpike(velocityPxPerS: number): boolean {
  return Math.abs(velocityPxPerS) >= SCROLL_SPIKE_PX_PER_S
}

/** 0 to 1 to 0 over `durationS`, smooth at both ends. Drives the brow raise and the head tilt. */
export function reactionEnvelope(tSeconds: number, durationS: number): number {
  if (tSeconds <= 0 || tSeconds >= durationS) return 0
  return Math.sin((Math.PI * tSeconds) / durationS) ** 2
}

export const SWAY = { durationS: 0.3, amplitudeRad: degToRad(3) } as const

/** Body roll for the scroll-flick "whoa": one decaying oscillation over 0.3 s. */
export function swayAngle(tSeconds: number): number {
  if (tSeconds <= 0 || tSeconds >= SWAY.durationS) return 0
  const phase = tSeconds / SWAY.durationS
  return SWAY.amplitudeRad * Math.sin(2 * Math.PI * phase) * (1 - phase)
}

export type FpsAction = 'ok' | 'dpr1' | 'fallback'

/** mascot-sino.md section 3: under 45 fps drop the pixel ratio to 1, under 30 fps use the poster. */
export function classifyFps(fps: number): FpsAction {
  if (fps < 30) return 'fallback'
  if (fps < 45) return 'dpr1'
  return 'ok'
}

const PROBE_FRAMES = 60

/**
 * Measures the average frame rate over the first 60 frames and reports once. The first interval
 * is thrown away: it contains shader compilation and the first texture upload, which is a one-off
 * hitch and not a sign of a slow GPU. Feed it the rAF timestamps; `rebase` after a pause so the
 * time spent hidden is not counted as one very long frame.
 */
export function createFpsProbe() {
  let last: number | null = null
  let skipped = false
  let sum = 0
  let count = 0
  let done = false
  return {
    frame(timestampMs: number): { fps: number; action: FpsAction } | null {
      if (done) return null
      if (last === null) {
        last = timestampMs
        return null
      }
      const interval = timestampMs - last
      last = timestampMs
      if (!skipped) {
        skipped = true
        return null
      }
      sum += interval
      count += 1
      if (count < PROBE_FRAMES) return null
      done = true
      const fps = 1000 / (sum / count)
      return { fps, action: classifyFps(fps) }
    },
    rebase() {
      last = null
    },
  }
}
