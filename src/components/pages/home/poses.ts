import type { MediaAsset, PoseKey } from '@/features/content/types'

// The content DTO names a Sino pose by key (S1 to S14 in 3d-asset-requirements.md); the page turns
// the key into a picture here. Files live under public/mascot/poses with the project naming
// convention `sino-pose-{action}`. They are plain URL strings, never `import`ed, so a pose that
// has not been exported yet cannot fail the build: it only 404s at request time.
//
// Every pose is exported as a 1:1 crop (3d-asset-requirements.md section 3.2), so the box is
// reserved at that ratio before the file arrives. If the asset team ships another crop or size,
// this is the one place to change.
const POSE_DIRECTORY = '/mascot/poses'
const POSE_SIZE = 1200

/**
 * Sino poses are decorative: the headline and body beside them carry the meaning, so the alt is
 * empty (copywriting.md section 8) and screen readers skip them.
 */
export function poseImage(pose: PoseKey): MediaAsset {
  return {
    url: `${POSE_DIRECTORY}/sino-pose-${pose}.webp`,
    width: POSE_SIZE,
    height: POSE_SIZE,
    alt: '',
    blurDataUrl: null,
  }
}

/**
 * Art direction for the "How we work" screens, in step order (Talk, Plan, Build, Support). The
 * step text comes from the content; only the picture beside it is chosen here. A step beyond the
 * fourth reuses the list from the start.
 */
export const HOW_WE_WORK_POSES = [
  'magnifier',
  'whiteboard',
  'building-blocks',
  'handover',
] as const satisfies readonly PoseKey[]
