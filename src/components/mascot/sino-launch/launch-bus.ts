export type LaunchKind = 'booking' | 'whatsapp' | 'waitlist'
export type LaunchOrigin = { left: number; top: number; width: number; height: number }
export type LaunchRequest = { kind: LaunchKind; originRect: LaunchOrigin; ready: boolean }
export type LaunchEnvironment = {
  reduced: boolean
  saveData: boolean
  webdriver: boolean
  hidden: boolean
}
export type LaunchClick = {
  button: number
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  defaultPrevented?: boolean
}

/** One switch to stop CTA launches if conversion measurements warrant it. */
export const LAUNCH_ENABLED = true
export const LAUNCH_SESSION_KEY = 'sineva:jet-launches:v1'
export const isPlainLaunchClick = (event: LaunchClick) =>
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey &&
  !event.defaultPrevented

export function readLaunchEnvironment(): LaunchEnvironment {
  return {
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: Boolean(
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
    ),
    webdriver: navigator.webdriver,
    hidden: document.visibilityState === 'hidden',
  }
}

export const canLaunch = (env: LaunchEnvironment) =>
  LAUNCH_ENABLED && !env.reduced && !env.saveData && !env.webdriver && !env.hidden

export function createLaunchBus({
  environment,
  storage,
}: {
  environment: () => LaunchEnvironment
  storage?: Pick<Storage, 'getItem' | 'setItem'>
}) {
  const listeners = new Set<(request: LaunchRequest) => void>()
  const used = new Set<LaunchKind>()
  try {
    const stored: unknown = JSON.parse(storage?.getItem(LAUNCH_SESSION_KEY) ?? '[]')
    if (Array.isArray(stored)) {
      for (const kind of stored) {
        if (kind === 'booking' || kind === 'whatsapp' || kind === 'waitlist') used.add(kind)
      }
    }
  } catch {
    /* Private browsing can deny storage; the in-memory cap still holds. */
  }

  return {
    eligible(kind: LaunchKind) {
      return canLaunch(environment()) && used.size < 2 && !used.has(kind)
    },
    requestLaunch(request: LaunchRequest) {
      if (!request.ready || !this.eligible(request.kind) || listeners.size === 0) return false
      used.add(request.kind)
      try {
        storage?.setItem(LAUNCH_SESSION_KEY, JSON.stringify([...used]))
      } catch {
        /* Memory cap. */
      }
      for (const listener of listeners) listener(request)
      return true
    },
    subscribe(listener: (request: LaunchRequest) => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

/** Validated forms signal only after opening their destination, never on an invalid click. */
export function signalLaunch(kind: LaunchKind, element: HTMLElement) {
  document.dispatchEvent(
    new CustomEvent('sineva:launch', {
      detail: { kind, originRect: element.getBoundingClientRect() },
    }),
  )
}
export function markContactHandoff() {
  try {
    sessionStorage.setItem('sineva:contact-handoff', String(Date.now()))
  } catch {
    /* Optional decoration. */
  }
}
