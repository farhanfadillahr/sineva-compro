import { Badge, Card, type ActionLinkComponent } from '@/components/ui'
import type { PostSummary } from '@/features/content/types'
import { CardLink } from '../home/card-link'
import { blogPostHref } from './blog-model'
import { formatDate, formatMinutes } from './blog-format'
import { PostCover } from './post-cover'

/**
 * The latest article as a wide split card (page-patterns.md 2.6): cover left, category, title,
 * excerpt and date right. The title is the stretched link, so the card is one click target with
 * the title as its accessible name; "Read article" is the visual cue and stays out of the
 * accessibility tree, because a second link with the same destination would read twice.
 */
export function FeaturedPost({
  post,
  locale,
  latestLabel,
  readLabel,
  linkComponent,
}: {
  post: PostSummary
  locale: string
  latestLabel: string
  readLabel: string
  linkComponent?: ActionLinkComponent
}) {
  return (
    <Card
      as="article"
      variant="post"
      interactive
      data-blog-featured=""
      className="relative w-full md:grid md:grid-cols-2"
    >
      <div className="aspect-video md:aspect-auto md:min-h-80">
        <PostCover cover={post.cover} sizes="(min-width: 768px) 50vw, 100vw" priority />
      </div>
      <div className="flex flex-col items-start justify-center gap-4 p-6 sm:p-8 lg:p-12">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="warm">{latestLabel}</Badge>
          {post.category ? <Badge tone="brand">{post.category.name}</Badge> : null}
        </div>
        <h2 className="text-h3 text-balance text-text group-hover/card:underline">
          <CardLink href={blogPostHref(post.slug)} linkComponent={linkComponent}>
            {post.title}
          </CardLink>
        </h2>
        <p className="max-w-[52ch] text-lead text-pretty text-text-secondary">{post.excerpt}</p>
        <p className="flex flex-wrap items-center gap-x-2 font-mono text-micro text-text-secondary">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>
          <span aria-hidden="true">{'·'}</span>
          <span>{formatMinutes(post.readingMinutes, locale)}</span>
        </p>
        <span aria-hidden="true" className="text-label text-(--color-link)">
          {readLabel}
        </span>
      </div>
    </Card>
  )
}
