export type LottieState = 'loading' | 'ready' | 'error' | undefined

/**
 * Report the `data-lottie-state` of the first LottiePlayer box inside `root`, now and on every
 * change. LottiePlayer exposes its progress only through that attribute (it has no ready
 * callback), and it is not in this folder's remit to add one, so this observes the DOM instead.
 * Returns the stop function.
 */
export function observeLottieState(
  root: Element,
  onState: (state: LottieState) => void,
): () => void {
  const read = () =>
    root.querySelector<HTMLElement>('[data-lottie-state]')?.dataset.lottieState as LottieState
  onState(read())
  if (typeof MutationObserver === 'undefined') return () => {}
  const observer = new MutationObserver(() => onState(read()))
  observer.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['data-lottie-state'],
  })
  return () => observer.disconnect()
}
