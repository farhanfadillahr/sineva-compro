import 'server-only'
import { db } from '../../lib/db/client.server'
import { cacheTags } from '../../lib/cache/tags'
import type { ListPostsInput, PublicContentSource } from '../content/public'
import type { Category, ContentLocale, PostDetail, PostPage, PostSummary } from '../content/types'
import { cachedRead } from '../cms/cache.server'
import { resolveMedia } from '../cms/media.server'
import { isPreviewRequest } from '../cms/preview.server'
import { publicCollection } from '../collections/service.server'
import { publicDocuments } from '../documents/service.server'
import { authorSummary } from '../team/public.server'
import { projectPost } from './project'

async function listCategories(locale: ContentLocale): Promise<readonly Category[]> {
  return (await publicCollection(db, 'categories', locale)).map(({ key, local }) => ({
    slug: key,
    name: local.name as string,
  }))
}

async function allPosts(locale: ContentLocale, preview: boolean): Promise<PostDetail[]> {
  const [documents, categories] = await Promise.all([
    publicDocuments(db, 'posts', locale, preview),
    listCategories(locale),
  ])
  const posts = await Promise.all(
    documents.map(async (doc) => {
      const cover = doc.data.cover as { kind: string; media: unknown }
      return projectPost({
        slug: doc.slug,
        locale,
        data: doc.data,
        firstPublishedAt: doc.firstPublishedAt,
        lastPublishedAt: doc.lastPublishedAt,
        category: categories.find((c) => c.slug === doc.data.categorySlug) ?? null,
        author:
          typeof doc.data.authorId === 'string'
            ? await authorSummary(doc.data.authorId, locale)
            : null,
        coverMedia: cover.kind === 'media' ? await resolveMedia(db, cover.media, locale) : null,
      })
    }),
  )
  return posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

function summaryOf(post: PostDetail): PostSummary {
  const { slug, locale, title, excerpt, cover, category, author, publishedAt, readingMinutes } =
    post
  return { slug, locale, title, excerpt, cover, category, author, publishedAt, readingMinutes }
}

async function listPostsFrom(input: ListPostsInput, preview: boolean): Promise<PostPage> {
  const { locale, category, page, pageSize } = input
  if (!Number.isInteger(page) || page < 1) throw new RangeError('page must be an integer >= 1')
  if (!Number.isInteger(pageSize) || pageSize < 1)
    throw new RangeError('pageSize must be an integer >= 1')
  const matching = (await allPosts(locale, preview)).filter(
    (post) => category === undefined || post.category?.slug === category,
  )
  const start = (page - 1) * pageSize
  return {
    posts: matching.slice(start, start + pageSize).map(summaryOf),
    total: matching.length,
    page,
    pageSize,
  }
}

async function getPostFrom(slug: string, locale: ContentLocale, preview: boolean) {
  return (await allPosts(locale, preview)).find((post) => post.slug === slug) ?? null
}

const cachedList = cachedRead(
  'posts',
  (input: ListPostsInput) => listPostsFrom(input, false),
  (input) => [cacheTags.posts(input.locale)],
)
const cachedPost = cachedRead(
  'post',
  (slug: string, locale: ContentLocale) => getPostFrom(slug, locale, false),
  (slug, locale) => [
    cacheTags.posts(locale),
    ...(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? [cacheTags.post(slug, locale)] : []),
  ],
)

/** Authorised preview reads drafts without any cache; everyone else gets published snapshots. */
export const postReads = {
  async listPosts(input: ListPostsInput) {
    return (await isPreviewRequest()) ? listPostsFrom(input, true) : cachedList(input)
  },
  async getPost(slug: string, locale: ContentLocale) {
    return (await isPreviewRequest()) ? getPostFrom(slug, locale, true) : cachedPost(slug, locale)
  },
  listCategories: cachedRead('categories', listCategories, (l) => [cacheTags.categories(l)]),
} satisfies Partial<PublicContentSource>
