import type { ScrollScrubSequenceProps } from '@/components/motion/ScrollScrubSequence'

/**
 * Sino lifting his face to the visitor: 36 frames rendered from the v008 GLB (sino-3d-mascot
 * scripts/loops/render_loops.py, loop S-lookup), packed 6 per row at 480 px.
 */
export const SINO_LOOK_UP = {
  sprite: '/mascot/scrub/sino-look-up.webp',
  poster: '/mascot/scrub/sino-look-up-end.webp',
  frames: 36,
  cols: 6,
  frameWidth: 480,
  frameHeight: 480,
} as const satisfies Omit<ScrollScrubSequenceProps, 'className'>
