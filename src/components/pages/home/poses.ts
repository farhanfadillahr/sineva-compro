import type { MediaAsset, PoseKey } from '@/features/content/types'

// The content DTOs name a Sino pose by key (S1 to S14 in 3d-asset-requirements.md) and carry no
// image for it, so the page maps the key to a file the assets lane exported under
// public/mascot/poses. A test checks that every file named here exists. Images that the content
// does carry as media (the hero poster, the About scene) are used as given and never go through
// this map.
//
// A key without an entry has no exported still yet. `poseImage` returns null for it and the
// caller renders nothing, instead of a broken image.
export const POSE_FILES: Readonly<Partial<Record<PoseKey, string>>> = {
  wave: 'sino-wave',
  'holding-phone': 'sino-holding-phone',
  'typing-laptop': 'sino-laptop',
  megaphone: 'sino-megaphone',
  'coins-clipboard': 'sino-coins',
  handover: 'sino-handshake',
  magnifier: 'sino-magnifier',
  'building-blocks': 'sino-blocks',
  whiteboard: 'sino-whiteboard',
  'thumbs-up': 'sino-thumbs-up',
  confused: 'sino-confused',
  'relaxed-mug': 'sino-relaxed',
}

// Every still is a 1200 px square (the contract the static content also uses for poses), so the
// box is reserved at 1:1 before the file arrives.
const POSE_DIRECTORY = '/mascot/poses'
const POSE_SIZE = 1200

/**
 * Sino poses are decorative: the headline and body beside them carry the meaning, so the alt is
 * empty (copywriting.md section 8) and screen readers skip them.
 */
export function poseImage(pose: PoseKey): MediaAsset | null {
  const file = POSE_FILES[pose]
  if (!file) return null
  return {
    url: `${POSE_DIRECTORY}/${file}.webp`,
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
