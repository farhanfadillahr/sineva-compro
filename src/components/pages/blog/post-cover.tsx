import Image from 'next/image'
import { cx } from '@/components/ui/cx'
import type { CoverGradient, PostCover as PostCoverDto } from '@/features/content/types'
import { PoseImage } from '../home/pose-image'

// Full class names, not built from the key: Tailwind only generates utilities it finds as
// complete strings in the source.
const COVER_GRADIENT: Record<CoverGradient, string> = {
  teal: 'bg-(image:--gradient-cover-teal)',
  sun: 'bg-(image:--gradient-cover-sun)',
  mint: 'bg-(image:--gradient-cover-mint)',
}

/**
 * The cover of an article: uploaded media, or the cover kit (a Sino pose on a brand gradient).
 * It fills the box its parent sizes, so the card or the article header decides the aspect ratio.
 * An article without a cover leaves the tint block, never a broken image.
 */
export function PostCover({
  cover,
  sizes,
  priority = false,
  className,
}: {
  cover: PostCoverDto | null
  sizes: string
  /** The cover is the LCP element of the page: preload it. Media covers only. */
  priority?: boolean
  className?: string
}) {
  return (
    <div className={cx('relative size-full overflow-hidden bg-surface-tint', className)}>
      {cover?.kind === 'media' ? (
        <Image
          src={cover.media.url}
          width={cover.media.width}
          height={cover.media.height}
          alt={cover.media.alt}
          sizes={sizes}
          priority={priority}
          placeholder={cover.media.blurDataUrl ? 'blur' : 'empty'}
          blurDataURL={cover.media.blurDataUrl ?? undefined}
          className="size-full object-cover transition-transform duration-(--dur-med) ease-out group-hover/card:scale-[1.03] motion-reduce:transition-none"
        />
      ) : null}
      {cover?.kind === 'cover-kit' ? (
        <div
          data-slot="cover-kit"
          className={cx('grid size-full place-items-center', COVER_GRADIENT[cover.gradient])}
        >
          <PoseImage
            pose={cover.pose}
            sizes={sizes}
            fit="contain"
            className="aspect-square h-5/6"
          />
        </div>
      ) : null}
    </div>
  )
}
