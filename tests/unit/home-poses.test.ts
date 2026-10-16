import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { HOW_WE_WORK_POSES, POSE_FILES, poseImage } from '../../src/components/pages/home/poses'
import { createStaticContentSource } from '../../src/content/static'
import { POSE_KEYS, type PoseKey } from '../../src/features/content/types'

const PUBLIC_DIR = fileURLToPath(new URL('../../public', import.meta.url))
const onDisk = (url: string) => existsSync(join(PUBLIC_DIR, url))

// The DTOs name poses by key and carry no image for them. The page maps a key to the file the
// assets lane shipped; this is the only place where that mapping exists.
describe('poseImage', () => {
  const mapped = POSE_KEYS.filter((key) => poseImage(key) !== null)

  it('maps most pose keys to a file', () => {
    expect(mapped.length).toBeGreaterThanOrEqual(10)
  })

  it.each(mapped)('pose "%s" points at a real file under public/mascot/poses', (key) => {
    const asset = poseImage(key)!
    expect(asset.url).toMatch(/^\/mascot\/poses\/v006\/sino-[a-z-]+\.webp$/)
    expect(onDisk(asset.url), asset.url).toBe(true)
    // The AVIF twin ships with every pose: next/image serves it when the browser asks for it.
    expect(onDisk(asset.url.replace(/\.webp$/, '.avif')), asset.url).toBe(true)
    expect(asset.alt).toBe('')
    expect(asset.width).toBe(1200)
    expect(asset.height).toBe(1200)
  })

  it('returns null for a pose without an exported file instead of a broken image', () => {
    const unmapped = POSE_KEYS.filter((key) => !(key in POSE_FILES))
    for (const key of unmapped) expect(poseImage(key)).toBeNull()
  })

  it('every file in the map exists (no dead entry)', () => {
    for (const [key, name] of Object.entries(POSE_FILES)) {
      expect(onDisk(`/mascot/poses/v006/${name}.webp`), `${key} -> ${name}`).toBe(true)
    }
  })

  it('maps the four How we work steps to poses that exist', () => {
    expect(HOW_WE_WORK_POSES).toHaveLength(4)
    for (const key of HOW_WE_WORK_POSES) expect(poseImage(key), key).not.toBeNull()
  })

  it('covers every pose key the static content uses', async () => {
    const source = createStaticContentSource()
    const used = new Set<PoseKey>()
    const home = (await source.getPage('home', 'en'))!
    used.add(home.twoPaths.product.pose)
    used.add(home.twoPaths.services.pose)
    for (const capability of await source.listCapabilities('en')) used.add(capability.pose)
    for (const service of await source.listServices('en')) used.add(service.pose)
    const { posts } = await source.listPosts({ locale: 'en', page: 1, pageSize: 50 })
    for (const post of posts) if (post.cover?.kind === 'cover-kit') used.add(post.cover.pose)
    expect(used.size).toBeGreaterThan(0)
    for (const key of used) expect(poseImage(key), `used pose "${key}"`).not.toBeNull()
  })
})
