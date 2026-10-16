import Image from 'next/image'
import type { MediaAsset } from '@/features/content/types'
/** Accepts only the public projection, never storage keys or draft preview URLs. */
export function PublishedMediaImage({
  asset,
  sizes,
  className,
}: {
  asset: MediaAsset & { dominantColor?: string | null }
  sizes: string
  className?: string
}) {
  return (
    <Image
      src={asset.url}
      alt={asset.alt}
      width={asset.width}
      height={asset.height}
      sizes={sizes}
      className={className}
      placeholder={asset.blurDataUrl ? 'blur' : 'empty'}
      blurDataURL={asset.blurDataUrl ?? undefined}
      style={asset.dominantColor ? { backgroundColor: asset.dominantColor } : undefined}
    />
  )
}
