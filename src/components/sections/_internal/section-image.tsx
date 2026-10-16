import Image from 'next/image'
import type { MediaAsset } from '@/features/content/types'

type SectionImageProps = {
  image: MediaAsset
  /** The LCP image of the page: preloaded and fetched with high priority. Only one per page. */
  priority?: boolean
  sizes?: string
  className?: string
}

/**
 * next/image for a content `MediaAsset`. Width and height come from the asset so the box is
 * reserved before the file arrives (CLS 0). An empty `alt` marks the image as decorative
 * (copywriting.md section 8), which is the CMS's choice per locale.
 *
 * `priority` maps to `preload` plus `fetchPriority="high"`: Next.js 16 deprecated `priority`, and
 * `preload` alone only adds the <link> without raising the request priority.
 */
export function SectionImage({ image, priority = false, sizes, className }: SectionImageProps) {
  return (
    <Image
      src={image.url}
      width={image.width}
      height={image.height}
      alt={image.alt}
      sizes={sizes}
      className={className}
      placeholder={image.blurDataUrl ? 'blur' : 'empty'}
      blurDataURL={image.blurDataUrl ?? undefined}
      {...(priority ? { preload: true, fetchPriority: 'high' as const } : {})}
    />
  )
}
