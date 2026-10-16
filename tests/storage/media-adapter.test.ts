import { randomUUID } from 'node:crypto'
import { expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
import { readCredentials } from '../../scripts/storage/credentials'
import { readStorageConfig } from '../../src/lib/storage/config'
import { S3MediaStore } from '../../src/lib/media/s3-store.server'
it('proves the real media adapter contract including signed nonempty PUT and multipart', async () => {
  const config = readStorageConfig(process.env),
    credentials = await readCredentials(
      process.env.STORAGE_CREDENTIALS_DIR ?? '.storage/secrets',
      'app',
    )
  const store = new S3MediaStore({ endpoint: config.endpoint, credentials, prefix: 'test' })
  const prefix = `test/cpr23-${randomUUID()}/`,
    key = `${prefix}small.bin`,
    large = `${prefix}large.bin`,
    signed = `${prefix}signed.bin`
  const source = { bucket: 'private' as const, key },
    target = { bucket: 'public' as const, key },
    body = Buffer.from('nonempty media adapter fixture')
  try {
    await store.put({ ...source, body, contentType: 'application/pdf' })
    expect(await store.head(source)).toMatchObject({
      size: body.length,
      contentType: 'application/pdf',
    })
    expect((await store.get(source))?.body).toEqual(body)
    expect(await store.list('private', prefix)).toContain(key)
    const get = await fetch(await store.presign(source, 'GET'))
    expect(get.status).toBe(200)
    expect(Buffer.from(await get.arrayBuffer())).toEqual(body)
    const put = await fetch(
      await store.presign({ bucket: 'private', key: signed }, 'PUT', 120, 'application/pdf'),
      { method: 'PUT', headers: { 'content-type': 'application/pdf' }, body },
    )
    expect(put.status).toBe(200)
    expect((await store.get({ bucket: 'private', key: signed }))?.body).toEqual(body)
    await store.copy(source, target)
    expect((await store.get(target))?.body).toEqual(body)
    const multipart = Buffer.alloc(6 * 1024 * 1024, 0x5a)
    await store.put({ bucket: 'private', key: large, body: multipart, contentType: 'video/mp4' })
    expect((await store.get({ bucket: 'private', key: large }))?.body).toEqual(multipart)
    await store.delete(source)
    expect(await store.head(source)).toBeNull()
    expect(await store.get(source)).toBeNull()
  } finally {
    for (const bucket of ['private', 'public'] as const)
      for (const item of await store.list(bucket, prefix)) await store.delete({ bucket, key: item })
    store.close()
  }
})
