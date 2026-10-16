import Image from 'next/image'
import type { PoseKey } from '@/features/content/types'
import { poseImage } from './poses'

/**
 * A Sino pose as a decorative `next/image`; width and height reserve the box (CLS 0). Renders
 * nothing for a pose that has no exported still, so there is never a broken image.
 */
export function PoseImage({
  pose,
  sizes,
  className,
}: {
  pose: PoseKey
  sizes: string
  className?: string
}) {
  const asset = poseImage(pose)
  if (!asset) return null
  return (
    <Image
      src={asset.url}
      width={asset.width}
      height={asset.height}
      alt={asset.alt}
      sizes={sizes}
      className={className}
    />
  )
}
