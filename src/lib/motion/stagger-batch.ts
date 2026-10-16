import { revealPresets, stagger } from './tokens'

// Cards in a grid enter the viewport in groups: a whole row at once on desktop, one at a time on a
// phone. A stagger by list index gets both wrong (the sixth card of a single column waits 250 ms
// for nobody). Staggering by *arrival* instead: everything that becomes visible in the same task
// is one batch, ordered by document position, and a card that arrives alone starts at once.

type Entry = { el: Element; apply: (delayMs: number) => void }

let queue: Entry[] = []
let timer: ReturnType<typeof setTimeout> | null = null

function flush() {
  timer = null
  const batch = queue
  queue = []
  batch.sort((a, b) =>
    a.el === b.el
      ? 0
      : a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING
        ? -1
        : 1,
  )
  batch.forEach(({ apply }, rank) => {
    apply(Math.min(rank, stagger.maxItems - 1) * revealPresets.depth.stepMs)
  })
}

/**
 * Join the batch of elements revealing in this task. `apply` receives the stagger delay once the
 * batch closes. Why a timeout and not a microtask: every IntersectionObserver callback of one
 * rendering update runs in the same task, but a microtask checkpoint follows each callback, so a
 * microtask would close the batch after its first member. Returns a cancel function for unmount.
 */
export function joinStaggerBatch(el: Element, apply: (delayMs: number) => void): () => void {
  const entry: Entry = { el, apply }
  queue.push(entry)
  timer ??= setTimeout(flush, 0)
  return () => {
    queue = queue.filter((e) => e !== entry)
  }
}
