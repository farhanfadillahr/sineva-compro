import { describe, expect, it } from 'vitest'
import { collectMedia, parseFields } from '../../src/features/cms/fields'
import { dropUnusedCoverMedia, postsConfig } from '../../src/features/documents/configs'
import { launchPosts } from '../../src/features/posts/launch'

// CPR-113: switching a post cover from an image to the cover kit kept the image in media_usage.
const MEDIA_ID = '11111111-1111-4111-8111-111111111111'
const MEDIA = { kind: 'media', id: MEDIA_ID }
const withCover = (cover: Record<string, unknown>) => {
  const data = launchPosts()[0].data
  return { ...data, cover: { ...(data.cover as object), ...cover } }
}
const usage = (data: Record<string, unknown>) =>
  collectMedia(postsConfig.schema, postsConfig.normalize!(data)).map((ref) => ref.mediaId)

describe('post cover media usage', () => {
  it('counts the image only while the cover kind is media', () => {
    expect(usage(withCover({ kind: 'media', media: MEDIA }))).toEqual([MEDIA_ID])
    expect(usage(withCover({ kind: 'cover-kit', media: MEDIA }))).toEqual([])
    expect(usage(withCover({ kind: 'none', media: MEDIA }))).toEqual([])
  })

  it('keeps pose and gradient, and leaves data without a cover untouched', () => {
    const kit = dropUnusedCoverMedia(withCover({ kind: 'cover-kit', media: MEDIA }))
    expect(kit.cover).toMatchObject({ kind: 'cover-kit', media: null })
    expect((kit.cover as { pose: unknown }).pose).toBeTruthy()
    const plain = { title: 'x' }
    expect(dropUnusedCoverMedia(plain)).toBe(plain)
  })

  it('normalized data still passes the post schema', () => {
    const data = dropUnusedCoverMedia(withCover({ kind: 'cover-kit', media: MEDIA }))
    expect(parseFields(postsConfig.schema, data).ok).toBe(true)
  })
})
