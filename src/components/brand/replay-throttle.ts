/**
 * Returns a function that answers "may I replay now?". True at most once per `windowMs`; a refused
 * call does not push the window out, so hovering repeatedly never starves the next replay.
 * `now` is injectable so tests control time without patching globals.
 */
export function createReplayThrottle(
  windowMs: number,
  now: () => number = Date.now,
): () => boolean {
  let last = Number.NEGATIVE_INFINITY
  return () => {
    const t = now()
    if (t - last < windowMs) return false
    last = t
    return true
  }
}
