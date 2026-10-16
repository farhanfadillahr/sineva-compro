import { readFileSync, statSync } from 'node:fs'
import { brotliCompressSync } from 'node:zlib'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { POSE_FILES } from '@/components/pages/home/poses'
const root = join(process.cwd(), 'public')
describe('v008 delivery budgets', () => {
  it('has ten clips and both thrust attachment nodes within 600 KB brotli', () => {
    const data = readFileSync(join(root, 'mascot/sino-v008.glb'))
    const gltf = JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString())
    expect(brotliCompressSync(data).length).toBeLessThanOrEqual(600000)
    expect(gltf.animations.map((a: { name: string }) => a.name).sort()).toEqual(
      [
        'idle',
        'idle_b',
        'greet_wave',
        'listening',
        'thinking',
        'speaking',
        'happy_success',
        'jet_launch',
        'jet_hover',
        'jet_land',
      ].sort(),
    )
    for (const name of ['FX-jet_L', 'FX-jet_R', 'GEO-jet_nozzle_L', 'GEO-jet_nozzle_R'])
      expect(gltf.nodes.some((n: { name?: string }) => n.name === name)).toBe(true)
    expect(
      gltf.meshes.reduce(
        (sum: number, mesh: { primitives: unknown[] }) => sum + mesh.primitives.length,
        0,
      ),
    ).toBeLessThanOrEqual(25)
  })
  it.each(['launch', 'flyby', 'flyby-mail'])('%s videos stay within 600 KB each', (name) => {
    for (const ext of ['webm', 'mov'])
      expect(statSync(join(root, `mascot/launch/sino-${name}.${ext}`)).size).toBeLessThanOrEqual(
        600000,
      )
    expect(statSync(join(root, `mascot/launch/sino-${name}.webp`)).size).toBeLessThanOrEqual(120000)
  })
  it('uses the reviewed pose stills and a poster within 120 KB', () => {
    for (const name of Object.values(POSE_FILES))
      for (const ext of ['webp', 'avif'])
        expect(statSync(join(root, `mascot/poses/v008/${name}.${ext}`)).size).toBeLessThanOrEqual(
          120000,
        )
    for (const ext of ['webp', 'avif'])
      expect(statSync(join(root, `mascot/poster/v008/sino-hero.${ext}`)).size).toBeLessThanOrEqual(
        120000,
      )
  })
})
