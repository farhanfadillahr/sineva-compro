import { staticContentFor } from '../../content/static/source'
import type { ContentLocale } from '../content/types'
import { storedFromDto } from '../cms/fields'
import { withTopicTitle } from '../cms/seo-title'
import { postsConfig } from '../documents/configs'

/**
 * Stored snapshots of the launch articles of a locale (English by default), for the base seed and
 * tests. A locale without launch content has none.
 */
export function launchPosts(locale: ContentLocale = 'en') {
  return (staticContentFor(locale)?.postDetails ?? []).map((post) => {
    const data = {
      title: post.title,
      excerpt: post.excerpt,
      cover:
        post.cover?.kind === 'cover-kit'
          ? { kind: 'cover-kit', media: null, pose: post.cover.pose, gradient: post.cover.gradient }
          : post.cover?.kind === 'media'
            ? { kind: 'media', media: post.cover.media, pose: 'wave', gradient: 'teal' }
            : { kind: 'none', media: null, pose: 'wave', gradient: 'teal' },
      categorySlug: post.category?.slug ?? null,
      authorId: null,
      bylineName: post.author?.name ?? null,
      publishDate: post.publishedAt.slice(0, 10),
      body: post.body,
      seo: withTopicTitle(post.seo),
    }
    return {
      slug: post.slug,
      publishedAt: post.publishedAt,
      data: storedFromDto(postsConfig.schema, data) as Record<string, unknown>,
    }
  })
}
