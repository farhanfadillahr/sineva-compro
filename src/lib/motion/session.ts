import { useEffect, useRef, useState } from 'react'

const PREFIX = 'sineva:once:'

/**
 * Claim a once-per-session slot: true the first time it is called in this browser session (and the
 * flag is stored), false on every later call.
 *
 * Every storage access is wrapped because sessionStorage can throw on read (blocked site data,
 * sandboxed iframes) or on write (quota, old Safari private mode). If the flag cannot be read or
 * persisted the answer is false: with no memory the intro would replay on every load, which breaks
 * the "once per session, never block" rules in motion.md section 3.1, while skipping it costs
 * nothing. False on the server too.
 */
export function claimSessionOnce(key: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const storage = window.sessionStorage
    const name = PREFIX + key
    if (storage.getItem(name) !== null) return false
    storage.setItem(name, '1')
    return true
  } catch {
    return false
  }
}

/**
 * True after mount when this is the first time `key` is seen in the session. Always false during
 * server render and the first client render, so it is hydration-safe; consumers render the final,
 * static state first and opt into the one-off animation when this flips.
 *
 * The decision is stored in a ref because StrictMode runs effects twice in development: the second
 * run must reuse the first run's answer instead of finding the flag already set and reporting false.
 */
export function useOncePerSession(key: string): boolean {
  const [run, setRun] = useState(false)
  const decided = useRef<{ key: string; value: boolean } | null>(null)

  useEffect(() => {
    if (decided.current?.key !== key) decided.current = { key, value: claimSessionOnce(key) }
    // Reading storage is an external-system sync that cannot happen during render (server and
    // hydration must agree), so setting state from the effect is the point of this hook.
    setRun(decided.current.value)
  }, [key])

  return run
}
