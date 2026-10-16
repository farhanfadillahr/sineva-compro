import { useCallback, useEffect, useRef, useState, type FocusEvent } from 'react'

/**
 * True while an element inside the container has KEYBOARD focus.
 *
 * Why not CSS `:focus-within` or plain focus events: a mouse click on a link also focuses it,
 * and after a client-side navigation that link stays mounted and focused. Treating that as
 * "focus inside" would pin the header open until the visitor clicks somewhere else. The input
 * modality is tracked with the last pointerdown/keydown instead of `:focus-visible` because
 * modality is what the rule means and it behaves the same in every browser (and under jsdom).
 */
export function useKeyboardFocusWithin() {
  const [inside, setInside] = useState(false)
  const pointerModality = useRef(false)

  useEffect(() => {
    const onPointerDown = () => {
      pointerModality.current = true
    }
    const onKeyDown = () => {
      pointerModality.current = false
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [])

  const onFocus = useCallback(() => {
    if (!pointerModality.current) setInside(true)
  }, [])

  const onBlur = useCallback((event: FocusEvent<HTMLElement>) => {
    // relatedTarget is null when focus leaves the document or lands on a non-focusable element.
    if (!event.currentTarget.contains(event.relatedTarget)) setInside(false)
  }, [])

  return { inside, handlers: { onFocus, onBlur } }
}
