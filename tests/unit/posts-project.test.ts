import { describe, expect, it } from 'vitest'
import { staticContent } from '../../src/content/static/source'
import { parseFields } from '../../src/features/cms/fields'
import { postsConfig } from '../../src/features/documents/configs'
import { launchPosts } from '../../src/features/posts/launch'
import { projectPost } from '../../src/features/posts/project'

describe('posts', () => {
  it('launch articles pass the post descriptor unchanged', () => {
    for (const post of launchPosts())
      expect(parseFields(postsConfig.schema, post.data)).toEqual({ ok: true, value: post.data })
  })

  it('projects the stored snapshots back to the static post DTOs', () => {
    for (const post of launchPosts()) {
      const expected = staticContent.postDetails.find((p) => p.slug === post.slug)!
      expect(
        projectPost({
          slug: post.slug,
          locale: 'en',
          data: post.data,
          firstPublishedAt: post.publishedAt,
          lastPublishedAt: post.publishedAt,
          category: expected.category,
          author: null,
          coverMedia: null,
        }),
      ).toEqual(expected)
    }
  })

  it('allows an incomplete draft but not an incomplete publication', () => {
    const empty = { ...launchPosts()[0].data, title: '', excerpt: '' }
    expect(parseFields(postsConfig.schema, empty, { isAdmin: true, partial: true }).ok).toBe(true)
    expect(parseFields(postsConfig.schema, empty).ok).toBe(false)
  })

  it('rejects unsafe rich text and dashes even in drafts', () => {
    const data = launchPosts()[0].data
    const bad = (body: unknown) =>
      parseFields(postsConfig.schema, { ...data, body }, { isAdmin: true, partial: true }).ok
    expect(bad({ type: 'doc', content: [{ type: 'html', text: '<script>' }] })).toBe(false)
    expect(
      bad({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'x',
                marks: [{ type: 'link', attrs: { href: 'javascript:1' } }],
              },
            ],
          },
        ],
      }),
    ).toBe(false)
    expect(
      parseFields(postsConfig.schema, { ...data, title: 'A — B' }, { isAdmin: true, partial: true })
        .ok,
    ).toBe(false)
  })
})
