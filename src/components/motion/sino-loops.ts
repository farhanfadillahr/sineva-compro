import type { MediaAsset } from '../../features/content/types'

// The animated Sino loops (3d-asset-requirements.md section 3.4). Each loop ships as three files
// under public/mascot/loops: a VP9 alpha WebM, an HEVC alpha MOV and a WebP poster that doubles as
// the first paint. All five loops ship with the corrected v006 geometry. A test checks that every
// ready entry has its two videos and poster on disk.
//
// Width and height are the reserved box, not the master resolution: they give the video and the
// poster the same aspect ratio before a byte arrives, so the page does not shift (CLS 0). Update
// them with the delivered files if the render is not square.
export const LOOP_IDS = ['L-wave', 'L-phone', 'L-build', 'L-thumbs', 'L-confused'] as const
export type LoopId = (typeof LOOP_IDS)[number]

export type SinoLoopAsset = Readonly<{
  /** VP9 with alpha: Chrome, Edge, Firefox and every other non-WebKit browser. */
  webm: string
  /** HEVC with alpha: Safari and iOS. */
  mov: string
  /** First paint, and the whole picture under reduced motion, Save-Data or no playable source. */
  poster: string
  width: number
  height: number
  /** False until the three files are in `public/mascot/loops`. */
  ready: boolean
}>

const DIRECTORY = '/mascot/loops'
const SIZE = 720

const entry = (name: string): SinoLoopAsset => ({
  webm: `${DIRECTORY}/${name}.webm`,
  mov: `${DIRECTORY}/${name}.mov`,
  poster: `${DIRECTORY}/${name}.webp`,
  width: SIZE,
  height: SIZE,
  ready: true,
})

export const SINO_LOOPS: Readonly<Record<LoopId, SinoLoopAsset>> = {
  'L-wave': entry('sino-loop-wave'),
  'L-phone': entry('sino-loop-phone'),
  'L-build': entry('sino-loop-build'),
  'L-thumbs': entry('sino-loop-thumbs'),
  'L-confused': entry('sino-loop-confused'),
}

export function isLoopReady(id: LoopId): boolean {
  return SINO_LOOPS[id].ready
}

/** The poster as a decorative image: Sino loops carry no meaning of their own, so the alt is empty. */
export function loopPoster(id: LoopId): MediaAsset {
  const { poster, width, height } = SINO_LOOPS[id]
  return { url: poster, width, height, alt: '', blurDataUrl: null }
}
