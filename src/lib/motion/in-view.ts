// Viewport helpers shared by Reveal and LottiePlayer. Nothing here touches the DOM at import time,
// so it is safe to import from server-rendered trees.

type Box = { top: number; bottom: number; height: number }

/**
 * Synchronous "is this already on screen?" check used at mount, before first paint, to decide
 * whether an element needs the reveal `from` state at all. The IntersectionObserver cannot do
 * this job: its first callback arrives after paint, which would flash content that was visible.
 *
 * Elements wholly above the viewport count as seen (scroll restoration and anchor jumps would
 * otherwise leave a hidden block behind the reader that rises when they scroll back up).
 *
 * A block taller than viewport / threshold can never reach `threshold` as a ratio, so the visible
 * share of the *viewport* is accepted too. IntersectionObserver has the same blind spot (it only
 * fires on ratio crossings), so keep revealed blocks well under ~6 viewports tall.
 */
export function isInViewport(box: Box, viewportHeight: number, threshold: number): boolean {
  if (box.bottom <= 0) return true
  if (box.top >= viewportHeight) return false
  if (box.height <= 0) return true
  const visible = Math.min(box.bottom, viewportHeight) - Math.max(box.top, 0)
  return visible / box.height >= threshold || visible >= viewportHeight * threshold
}

export function supportsIntersectionObserver(): boolean {
  return typeof IntersectionObserver === 'function'
}

/**
 * Observe one element and report whether at least `threshold` of it is visible, on every change.
 * `isIntersecting` alone is not enough: the observer's first callback fires with any overlap, even
 * 1%, regardless of the configured threshold. Returns a disconnect function; without
 * IntersectionObserver it observes nothing and the returned function is a no-op.
 */
export function observeVisibility(
  el: Element,
  onChange: (visible: boolean) => void,
  options: { threshold?: number; rootMargin?: string } = {},
): () => void {
  if (!supportsIntersectionObserver()) return () => {}
  const { threshold = 0, rootMargin } = options
  const io = new IntersectionObserver(
    (entries) => {
      // Entries arrive oldest first; only the newest state of this element matters.
      const entry = entries[entries.length - 1]
      if (entry) onChange(entry.isIntersecting && entry.intersectionRatio >= threshold)
    },
    { threshold, rootMargin },
  )
  io.observe(el)
  return () => io.disconnect()
}
