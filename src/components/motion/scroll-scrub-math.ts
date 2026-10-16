// Pure maths for ScrollScrubSequence, kept free of the DOM so it is tested in node.

/** Where the scrub starts: the element top crosses this share of the viewport height. */
const START_LINE = 0.72
/** Where it ends: the element centre crosses this share of the viewport height. */
const END_LINE = 0.42

/**
 * Scroll progress of an element through its scrub window, 0 to 1. It starts once the element is
 * well on screen (its top at 72 % of the viewport, after the section reveal) and finishes when its
 * centre is just above the middle, so the motion
 * completes while the visitor is looking at it, not after it has scrolled away.
 */
export function scrubProgress(
  box: { top: number; height: number },
  viewportHeight: number,
): number {
  const start = viewportHeight * START_LINE
  const end = viewportHeight * END_LINE - box.height / 2
  if (start <= end) return 1
  const p = (start - box.top) / (start - end)
  return Math.min(1, Math.max(0, p))
}

/** Frame index for a progress value, clamped to the sequence. */
export function frameFor(progress: number, frames: number): number {
  const p = Math.min(1, Math.max(0, progress))
  return Math.round(p * (frames - 1))
}
