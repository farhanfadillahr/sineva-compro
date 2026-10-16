import { useEffect } from 'react'

/**
 * Locks page scroll while `active`, including on iOS Safari.
 *
 * `overflow: hidden` on body is not enough there: Safari still scrolls the page behind an overlay.
 * Pinning the body with `position: fixed` and a negative `top` freezes it in place, and the saved
 * offset is restored on release. Two side effects are handled on purpose:
 * - the scrollbar disappears and the layout would jump, so its width is added as padding;
 * - restoring must be instant: `behavior: 'instant'` beats a global `scroll-behavior: smooth`
 *   (motion.md section 4), which would otherwise animate the page back from the top.
 * Gotcha: while locked, `window.scrollY` reads 0, so code that reacts to scroll offsets must
 * ignore events during the lock (see `useHeaderMode({ frozen })`).
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    const { body, documentElement } = document
    const scrollY = window.scrollY
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
    }

    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`

    return () => {
      body.style.position = previous.position
      body.style.top = previous.top
      body.style.left = previous.left
      body.style.right = previous.right
      body.style.width = previous.width
      body.style.paddingRight = previous.paddingRight
      window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' })
    }
  }, [active])
}
