import { AgXToneMapping } from 'three'

/**
 * Renderer and light settings for the realtime hero. The hero poster and the approved v005
 * stills come from Blender with the AgX view transform, so the canvas uses three's AgX too:
 * with Neutral the pale suit read as a saturated teal and the poster-to-canvas crossfade jumped.
 * The rim stays teal for silhouette separation on white (mascot-sino.md section 4) but softer
 * than the key, matching the subtle rim in the renders.
 */
export const SINO_LOOK = {
  toneMapping: AgXToneMapping,
  exposure: 1.1,
  jet: { plasma: 0x00949b, core: 0x2fe0d8, smoke: 0x6cc6c9 },
  environmentIntensity: 0.9,
  key: { color: 0xffffff, intensity: 2.6, position: [-2, 3, 2.5] as const },
  rim: { color: 0x80d2d2, intensity: 1.1, position: [2.5, 1.5, -2] as const },
} as const
