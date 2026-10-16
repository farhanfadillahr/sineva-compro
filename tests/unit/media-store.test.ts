import { describe, expect, it } from 'vitest'
import { MemoryMediaStore } from '@/lib/media/memory-store'

describe('MediaStore contract', () => {
  it('isolates buckets, returns copies and supports head/list/copy/delete', async () => {
    const store = new MemoryMediaStore('test')
    const location = { bucket: 'private' as const, key: 'test/asset.png' }
    const body = Buffer.from('original')
    await store.put({ ...location, body, contentType: 'image/png' })
    body.fill(0)
    expect((await store.get(location))?.body.toString()).toBe('original')
    expect(await store.head({ ...location, bucket: 'public' })).toBeNull()
    expect(await store.head(location)).toMatchObject({ size: 8, contentType: 'image/png' })
    const target = { bucket: 'public' as const, key: location.key }
    await store.copy(location, target)
    expect((await store.get(target))?.body.toString()).toBe('original')
    expect(await store.list('private', 'test/')).toEqual(['test/asset.png'])
    await store.delete(location)
    await store.delete(location)
    expect(await store.get(location)).toBeNull()
    expect(await store.head(target)).not.toBeNull()
  })
  it('rejects other environment prefixes and path traversal', async () => {
    const store = new MemoryMediaStore('preview-23')
    for (const key of ['production/file', 'preview-23/../file', 'preview-230/file'])
      await expect(
        store.put({ bucket: 'private', key, body: Buffer.from('x'), contentType: 'image/png' }),
      ).rejects.toThrow()
    expect(() => new MemoryMediaStore('../production')).toThrow()
  })
})
