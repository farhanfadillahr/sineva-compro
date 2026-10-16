// Pure timeline for the animated phone chat: which bubbles are on screen and whether Sino is
// typing, at each moment of one loop. Kept free of React and the DOM so it is unit tested in node.

type Speaker = { from: 'user' | 'sino' }

export type ChatStep = Readonly<{
  /** Milliseconds from the start of the loop. */
  at: number
  /** How many bubbles are visible from this step on. */
  shown: number
  /** Sino's typing dots are visible. */
  typing: boolean
}>

export const CHAT_TIMING = {
  /** Pause before the first bubble, so the empty chat registers. */
  startMs: 450,
  /** Gap after a request before Sino starts typing. */
  readMs: 650,
  /** How long the typing dots show before Sino's reply lands. */
  typingMs: 1300,
  /** Gap after a reply before the next request. */
  replyGapMs: 1100,
  /** The finished conversation stays on screen this long before the loop restarts. */
  holdMs: 3200,
  loopLength(steps: readonly ChatStep[]): number {
    const last = steps[steps.length - 1]
    return last ? last.at + CHAT_TIMING.holdMs : 0
  },
} as const

/**
 * One loop: empty, then each request appears; before each Sino reply the typing dots show for
 * `typingMs`. Only Sino types, the visitor's requests appear at once like a sent message.
 */
export function chatTimeline(bubbles: readonly Speaker[]): ChatStep[] {
  if (bubbles.length === 0) return []
  const steps: ChatStep[] = [{ at: 0, shown: 0, typing: false }]
  let t = CHAT_TIMING.startMs
  bubbles.forEach((bubble, index) => {
    if (bubble.from === 'sino') {
      steps.push({ at: t, shown: index, typing: true })
      t += CHAT_TIMING.typingMs
      steps.push({ at: t, shown: index + 1, typing: false })
      t += CHAT_TIMING.replyGapMs
    } else {
      steps.push({ at: t, shown: index + 1, typing: false })
      t += CHAT_TIMING.readMs
    }
  })
  return steps
}
