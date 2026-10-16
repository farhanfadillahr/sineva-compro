import { describe, expect, it } from 'vitest'
import { HOW_WE_WORK_POSES, poseImage } from '../../src/components/pages/home/poses'
import { POSE_KEYS } from '../../src/features/content/types'

describe('poseImage', () => {
  it.each(POSE_KEYS)('resolves pose "%s" to a local, decorative image with a fixed size', (key) => {
    const asset = poseImage(key)
    // Local path under public/: no remote host to configure, no static import to break a build.
    expect(asset.url).toMatch(/^\/mascot\/poses\/sino-pose-[a-z-]+\.webp$/)
    expect(asset.url).toContain(key)
    expect(asset.alt).toBe('')
    expect(asset.width).toBeGreaterThan(0)
    expect(asset.height).toBeGreaterThan(0)
    expect(asset.blurDataUrl).toBeNull()
  })

  it('maps the four How we work steps to valid poses', () => {
    expect(HOW_WE_WORK_POSES).toHaveLength(4)
    for (const key of HOW_WE_WORK_POSES) expect(POSE_KEYS).toContain(key)
  })
})
