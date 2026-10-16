import { describe, expect, it } from 'vitest'
import { AgXToneMapping } from 'three'
import { SINO_LOOK } from '../../src/components/mascot/sino-look'

// The approved v005 renders and the hero poster were rendered with Blender AgX. The realtime
// canvas must use the same tone mapping and a soft teal rim, or the 300 ms crossfade from the
// poster shows a visible jump to a more saturated teal.
describe('Sino realtime look matches the Blender renders', () => {
  it('uses AgX tone mapping like the poster render', () => {
    expect(SINO_LOOK.toneMapping).toBe(AgXToneMapping)
  })

  it('keeps the teal rim softer than the key light', () => {
    expect(SINO_LOOK.rim.intensity).toBeLessThan(SINO_LOOK.key.intensity)
  })
})
