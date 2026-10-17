import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BlobMediaStore } from '@/lib/media/blob-store.server'

const sdk = vi.hoisted(() => ({
  put: vi.fn(),
  get: vi.fn(),
  head: vi.fn(),
  del: vi.fn(),
  list: vi.fn(),
  copy: vi.fn(),
  issueSignedToken: vi.fn(),
  presignUrl: vi.fn(),
}))
vi.mock('server-only', () => ({}))
vi.mock('@vercel/blob', () => ({ ...sdk, BlobNotFoundError: class extends Error {} }))
beforeEach(() => {
  vi.resetAllMocks()
})
const source = { bucket: 'private' as const, key: 'preview-development/asset.png' }
const target = { ...source, bucket: 'public' as const }
const store = () => new BlobMediaStore({ prefix: 'preview-development', token: 'test-secret' })

describe('Vercel Blob MediaStore', () => {
  it('keeps draft and published files in different paths inside a private store', async () => {
    const s = store()
    await s.put({ ...source, body: Buffer.from('image'), contentType: 'image/png' })
    expect(sdk.put).toHaveBeenCalledWith(
      'private/preview-development/asset.png',
      Buffer.from('image'),
      expect.objectContaining({ access: 'private', addRandomSuffix: false, allowOverwrite: false }),
    )
    sdk.head.mockResolvedValue({ size: 5, contentType: 'image/png' })
    await s.copy(source, target)
    expect(sdk.copy).toHaveBeenCalledWith(
      'private/preview-development/asset.png',
      'public/preview-development/asset.png',
      expect.objectContaining({
        access: 'private',
        contentType: 'image/png',
        allowOverwrite: false,
      }),
    )
    await s.delete(source)
    expect(sdk.del).toHaveBeenCalledWith(
      'private/preview-development/asset.png',
      expect.any(Object),
    )
  })
  it('returns file bytes and distinguishes a missing file from a storage outage', async () => {
    sdk.get.mockResolvedValue({
      statusCode: 200,
      stream: new Response('image').body,
      blob: { size: 5, contentType: 'image/png' },
    })
    const s = store()
    expect(await s.get(source)).toEqual({
      body: Buffer.from('image'),
      size: 5,
      contentType: 'image/png',
    })
    sdk.get.mockResolvedValue(null)
    expect(await s.get(source)).toBeNull()
    sdk.get.mockRejectedValue(new Error('unavailable'))
    await expect(s.get(source)).rejects.toThrow('unavailable')
  })
  it('lists all pages but never returns keys from a different namespace', async () => {
    sdk.list
      .mockResolvedValueOnce({
        blobs: [{ pathname: 'private/preview-development/a.png' }],
        hasMore: true,
        cursor: 'next',
      })
      .mockResolvedValueOnce({
        blobs: [{ pathname: 'private/preview-development/z.png' }],
        hasMore: false,
      })
    expect(await store().list('private', 'preview-development/')).toEqual([
      'preview-development/a.png',
      'preview-development/z.png',
    ])
    sdk.list.mockResolvedValue({
      blobs: [{ pathname: 'private/production/secret.png' }],
      hasMore: false,
    })
    await expect(store().list('private', 'preview-development/')).rejects.toThrow()
  })
  it('refuses traversal and other environments before contacting storage', async () => {
    for (const key of [
      'production/secret.png',
      'preview-development/../secret',
      'preview-development-other/a.png',
    ])
      await expect(store().get({ ...source, key })).rejects.toThrow()
    expect(sdk.get).not.toHaveBeenCalled()
    expect(() => new BlobMediaStore({ prefix: 'preview', token: 'test' })).toThrow()
  })
  it('limits a signed download to one file, GET, and at most five minutes', async () => {
    sdk.issueSignedToken.mockResolvedValue({
      delegationToken: 'scoped',
      clientSigningToken: 'ephemeral',
    })
    sdk.presignUrl.mockResolvedValue({
      presignedUrl: 'https://store.private.blob.vercel-storage.com/file?signed=1',
    })
    const before = Date.now()
    await store().presign(source, 'GET', 9999)
    const options = sdk.issueSignedToken.mock.calls[0][0]
    expect(options).toMatchObject({
      pathname: 'private/preview-development/asset.png',
      operations: ['get'],
    })
    expect(options.validUntil).toBeGreaterThan(before)
    expect(options.validUntil).toBeLessThanOrEqual(Date.now() + 300_000)
    expect(sdk.presignUrl.mock.calls[0][1]).toMatchObject({
      access: 'private',
      operation: 'get',
      pathname: 'private/preview-development/asset.png',
    })
  })
})
