import Image from 'next/image'
import { Badge, Card, type ActionLinkComponent } from '@/components/ui'
import type { CoverGradient, PostSummary } from '@/features/content/types'
import { CardLink } from './card-link'
import { PoseImage } from './pose-image'

// Full class names, not built from the key: Tailwind only generates utilities it finds as
// complete strings in the source.
const COVER_GRADIENT: Record<CoverGradient, string> = {
  teal: 'bg-(image:--gradient-cover-teal)',
  sun: 'bg-(image:--gradient-cover-sun)',
  mint: 'bg-(image:--gradient-cover-mint)',
}

// The date and the reading time follow the page locale without any message: Intl knows how to
// write "5 min" and "12 Oct 2026" in every locale. UTC keeps the day stable between server and
// browser, whatever the visitor's time zone.
function formatDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(iso),
  )
}
function formatMinutes(minutes: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'minute',
    unitDisplay: 'short',
  }).format(minutes)
}

/**
 * `card-post` (components.md section 4): 16:9 cover (uploaded media or the cover kit of a Sino
 * pose on a brand gradient), category chip, title clamped to two lines, date and reading time.
 * The whole card links to the article.
 */
export function PostCard({
  post,
  locale,
  linkComponent,
}: {
  post: PostSummary
  locale: string
  linkComponent?: ActionLinkComponent
}) {
  const { cover } = post
  return (
    <Card as="article" variant="post" interactive className="relative w-full">
      <div className="relative aspect-video overflow-hidden bg-surface-tint">
        {cover?.kind === 'media' ? (
          <Image
            src={cover.media.url}
            width={cover.media.width}
            height={cover.media.height}
            alt={cover.media.alt}
            sizes="(min-width: 1024px) 30vw, (min-width: 768px) 33vw, 90vw"
            placeholder={cover.media.blurDataUrl ? 'blur' : 'empty'}
            blurDataURL={cover.media.blurDataUrl ?? undefined}
            className="size-full object-cover transition-transform duration-(--dur-med) ease-out group-hover/card:scale-[1.03] motion-reduce:transition-none"
          />
        ) : null}
        {cover?.kind === 'cover-kit' ? (
          <div
            data-slot="cover-kit"
            className={`grid size-full place-items-center ${COVER_GRADIENT[cover.gradient]}`}
          >
            <PoseImage
              pose={cover.pose}
              sizes="(min-width: 1024px) 20vw, 50vw"
              fit="contain"
              className="aspect-square h-5/6"
            />
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col items-start gap-3 p-6">
        {post.category ? <Badge tone="brand">{post.category.name}</Badge> : null}
        <h3 className="line-clamp-2 text-h4 text-balance text-text group-hover/card:underline">
          <CardLink href={`/blog/${post.slug}`} linkComponent={linkComponent}>
            {post.title}
          </CardLink>
        </h3>
        <p className="mt-auto flex flex-wrap items-center gap-x-2 pt-2 font-mono text-micro text-text-secondary">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>
          <span aria-hidden="true">{'·'}</span>
          <span>{formatMinutes(post.readingMinutes, locale)}</span>
        </p>
      </div>
    </Card>
  )
}
