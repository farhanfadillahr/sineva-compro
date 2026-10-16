import { richTextWordCount } from '../../components/content/rich-text-model'
import type {
  AuthorSummary,
  Category,
  ContentLocale,
  CoverGradient,
  MediaAsset,
  PoseKey,
  PostCover,
  PostDetail,
  RichTextDocument,
  SeoFields,
} from '../content/types'

/** Same formula as the article page: words / 200, rounded up, at least 1. */
export function readingMinutes(body: RichTextDocument): number {
  return Math.max(1, Math.ceil(richTextWordCount(body) / 200))
}

/** Snapshot (with media already resolved) to the public post DTO. */
export function projectPost(input: {
  slug: string
  locale: ContentLocale
  data: Record<string, unknown>
  firstPublishedAt: string | null
  lastPublishedAt: string | null
  category: Category | null
  author: AuthorSummary | null
  coverMedia: MediaAsset | null
}): PostDetail {
  const { data } = input
  const cover = data.cover as { kind: string; pose: PoseKey; gradient: CoverGradient }
  const projectedCover: PostCover | null =
    cover.kind === 'cover-kit'
      ? { kind: 'cover-kit', pose: cover.pose, gradient: cover.gradient }
      : cover.kind === 'media' && input.coverMedia
        ? { kind: 'media', media: input.coverMedia }
        : null
  const body = data.body as RichTextDocument
  const publishedAt =
    typeof data.publishDate === 'string'
      ? `${data.publishDate}T02:00:00.000Z`
      : (input.firstPublishedAt ?? new Date(0).toISOString())
  const updated =
    input.lastPublishedAt &&
    input.firstPublishedAt &&
    input.lastPublishedAt !== input.firstPublishedAt
      ? input.lastPublishedAt
      : null
  return {
    slug: input.slug,
    locale: input.locale,
    title: data.title as string,
    excerpt: data.excerpt as string,
    cover: projectedCover,
    category: input.category,
    author:
      input.author ??
      (typeof data.bylineName === 'string'
        ? { name: data.bylineName, role: null, photo: null }
        : null),
    publishedAt,
    readingMinutes: readingMinutes(body),
    body,
    updatedAt: updated,
    seo: data.seo as SeoFields,
  }
}
