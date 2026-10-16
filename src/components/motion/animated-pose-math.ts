// Pure helpers for AnimatedPose, kept apart from the component so the numbers are testable and
// the component file stays about wiring.

/** The pose moves at 0.92x scroll speed relative to its card (mascot-sino.md section 5.1). */
export const PARALLAX_SPEED = 0.92
/** Largest shift in either direction. Keeps the pose inside the card's bleed area. */
export const PARALLAX_MAX_PX = 24

type Box = { top: number; height: number }

/**
 * Vertical offset (px) of the pose relative to its card.
 *
 * The card travels 1 px per scrolled px, the pose 0.92 px, so the pose drifts by (1 - 0.92) of the
 * scrolled distance. Distance is measured from the viewport centre: zero offset when the card is
 * centred, the pose rides above before that and sinks below after it. Across a full pass through
 * the viewport the raw value is well over 24 px (0.08 x ~1000 px), so the clamp is what actually
 * defines the range and the pose pins at the ends instead of drifting out of its card.
 *
 * Rounded to 0.1 px: below that is invisible, and a stable value lets the caller skip redundant
 * style writes.
 */
export function parallaxOffset(box: Box, viewportHeight: number): number {
  const cardCentre = box.top + box.height / 2
  const raw = (1 - PARALLAX_SPEED) * (viewportHeight / 2 - cardCentre)
  const clamped = Math.max(-PARALLAX_MAX_PX, Math.min(PARALLAX_MAX_PX, raw))
  // `+ 0` turns -0 into 0 so the written value never reads "-0px".
  return Math.round(clamped * 10) / 10 + 0
}

export type Phase = 0 | 1
export type Tilt = 1 | -1

/** Even positions start the float at 0, odd ones half a cycle in, so neighbours never sync up. */
export function phaseForIndex(index: number): Phase {
  return Math.abs(Math.trunc(index)) % 2 === 0 ? 0 : 1
}

/** Sintra pattern: even cards tilt clockwise, odd ones counter-clockwise (motion.md section 6). */
export function tiltForIndex(index: number): Tilt {
  return phaseForIndex(index) === 0 ? 1 : -1
}

/**
 * Stable 0 or 1 from a React `useId` value. Used when the caller gives no index: the id is the same
 * on the server and in the browser, so hydration agrees, which a module-level counter would not
 * guarantee.
 */
export function parityOfId(id: string): number {
  let sum = 0
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i)
  return sum % 2
}

/**
 * Parallax offset (px) for a visual that is on screen from the first paint (a hero), keyed to the
 * page scroll instead of the viewport centre. Same drift as `parallaxOffset` ((1 - 0.92) px per
 * scrolled px, same clamp), but zero at scrollY 0: the centre-based form would start a hero at
 * about +14 px and make it jump the moment the script runs. Negative scroll (iOS rubber band) is
 * ignored so the visual never moves up past its natural position.
 */
export function scrollParallaxOffset(scrollY: number): number {
  const raw = (1 - PARALLAX_SPEED) * Math.max(0, scrollY)
  return Math.round(Math.min(PARALLAX_MAX_PX, raw) * 10) / 10 + 0
}
