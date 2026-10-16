// Scroll lock for the splash (docs/design/motion.md section 3.1): the page is open for reading
// under a cover, and a scrolled page would be a different page by the time the cover lifts.
//
// Gotchas:
// - `overflow: hidden` on <html> removes a classic (non-overlay) scrollbar and widens the layout by
//   its width, which would shift the whole page under the overlay and again when it comes back.
//   `scrollbar-gutter: stable` keeps the gutter, so nothing moves in either direction.
// - Inline styles are saved and restored one by one, not cleared: something else (a dialog, the
//   user's own CSS) may have set them first. Restoring is once-only for the same reason.

/** Locks scroll on <html> and returns the function that gives it back. */
export function lockScroll(): () => void {
  const style = document.documentElement.style
  const previous = { overflow: style.overflow, scrollbarGutter: style.scrollbarGutter }
  style.overflow = 'hidden'
  style.scrollbarGutter = 'stable'
  let released = false
  return () => {
    if (released) return
    released = true
    style.overflow = previous.overflow
    style.scrollbarGutter = previous.scrollbarGutter
  }
}
