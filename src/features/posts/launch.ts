import { staticContent } from '../../content/static/source'
import { storedFromDto } from '../cms/fields'
import { withTopicTitle } from '../cms/seo-title'
import { postsConfig } from '../documents/configs'

/** Stored snapshots of the launch articles, for the base seed and tests. */
export function launchPosts() {
  return staticContent.postDetails.map((post) => {
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
