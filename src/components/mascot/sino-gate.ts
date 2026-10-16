// The loading gate (docs/design/mascot-sino.md section 3). It decides whether the realtime Sino is
// worth starting at all; nothing here imports three.js, so the check itself costs a few hundred
// bytes in the page bundle and the 3D chunk is only fetched on a pass.

export type GateEnvironment = {
  /** The site setting `enableRealtimeSino` (CPR-29). */
  enabled: boolean
  inViewport: boolean
  webgl2: boolean
  reducedMotion: boolean
  saveData: boolean
  webdriver?: boolean
  /** `navigator.deviceMemory` in GB (capped at 8 by browsers), or null when not reported. */
  deviceMemoryGb: number | null
}

export type GateReason =
  'disabled' | 'bot' | 'reduced-motion' | 'save-data' | 'low-memory' | 'out-of-view' | 'no-webgl2'

export type GateDecision = { pass: true } | { pass: false; reason: GateReason }

const MIN_MEMORY_GB = 4

/**
 * Pure decision over plain data. The order is deliberate: the admin switch first (so a switch-off
 * is never reported as a slow device), then the permanent per-user failures, then `out-of-view`,
 * which is the only retryable one, so it must not hide a permanent failure behind it.
 */
export function evaluateSinoGate(env: GateEnvironment): GateDecision {
  if (!env.enabled) return { pass: false, reason: 'disabled' }
  if (env.webdriver) return { pass: false, reason: 'bot' }
  if (env.reducedMotion) return { pass: false, reason: 'reduced-motion' }
  if (env.saveData) return { pass: false, reason: 'save-data' }
  if (env.deviceMemoryGb !== null && env.deviceMemoryGb < MIN_MEMORY_GB) {
    return { pass: false, reason: 'low-memory' }
  }
  if (!env.inViewport) return { pass: false, reason: 'out-of-view' }
  if (!env.webgl2) return { pass: false, reason: 'no-webgl2' }
  return { pass: true }
}

type NetworkInformationLike = { saveData?: boolean }
type GateWindow = Window &
  typeof globalThis & {
    navigator: Navigator & { connection?: NetworkInformationLike; deviceMemory?: number }
  }

/**
 * WebGL2 is probed with a throwaway canvas and the context is released straight away. Browsers
 * allow about 16 live contexts per page and the real renderer needs one. WebGL1 is not probed:
 * three.js has required WebGL2 since r163, so a WebGL1-only browser cannot run the runtime.
 */
function hasWebgl2(win: GateWindow): boolean {
  try {
    const canvas = win.document.createElement('canvas')
    const context = canvas.getContext('webgl2') as WebGL2RenderingContext | null
    if (!context) return false
    context.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

/**
 * Collects the gate inputs from the browser. Cheap checks run first and the WebGL probe (a real
 * context creation, a few ms) only runs when everything before it already passed.
 */
export function readGateEnvironment(
  win: GateWindow,
  hero: Element,
  enabled: boolean,
): GateEnvironment {
  const reducedMotion = win.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  const saveData = win.navigator.connection?.saveData === true
  const reported = win.navigator.deviceMemory
  const deviceMemoryGb = typeof reported === 'number' ? reported : null

  const rect = hero.getBoundingClientRect()
  const inViewport = rect.bottom > 0 && rect.top < win.innerHeight

  const mayProbe =
    enabled &&
    !win.navigator.webdriver &&
    !reducedMotion &&
    !saveData &&
    (deviceMemoryGb === null || deviceMemoryGb >= MIN_MEMORY_GB) &&
    inViewport
  return {
    enabled,
    webdriver: win.navigator.webdriver === true,
    inViewport,
    webgl2: mayProbe ? hasWebgl2(win) : false,
    reducedMotion,
    saveData,
    deviceMemoryGb,
  }
}

const IDLE_TIMEOUT_MS = 2000
const IDLE_FALLBACK_MS = 200

/**
 * Runs `run` after `window.load` and then an idle slot, so the canvas work never competes with
 * the LCP image or hydration. `requestIdleCallback` is missing in Safari: a short timer stands in.
 * The idle request has a timeout so a permanently busy main thread cannot postpone it forever.
 * Returns a cancel function that is safe to call at any stage.
 */
export function whenLoadedAndIdle(win: GateWindow, run: () => void): () => void {
  let cancelled = false
  let idleId: number | null = null
  let timerId: ReturnType<typeof setTimeout> | null = null

  const onIdle = () => {
    idleId = null
    timerId = null
    if (!cancelled) run()
  }
  const scheduleIdle = () => {
    if (cancelled) return
    if (typeof win.requestIdleCallback === 'function') {
      idleId = win.requestIdleCallback(onIdle, { timeout: IDLE_TIMEOUT_MS })
    } else {
      timerId = setTimeout(onIdle, IDLE_FALLBACK_MS)
    }
  }

  const onLoad = () => {
    win.removeEventListener('load', onLoad)
    scheduleIdle()
  }
  if (win.document.readyState === 'complete') scheduleIdle()
  else win.addEventListener('load', onLoad)

  return () => {
    cancelled = true
    win.removeEventListener('load', onLoad)
    if (idleId !== null) win.cancelIdleCallback?.(idleId)
    if (timerId !== null) clearTimeout(timerId)
  }
}
