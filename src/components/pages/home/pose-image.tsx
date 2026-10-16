import { AnimatedPose, type AnimatedPoseProps } from '@/components/motion/animated-pose'
import type { PoseKey } from '@/features/content/types'
import { poseImage } from './poses'

/**
 * A Sino pose as a decorative, animated `next/image`: the key resolves to the exported still and
 * AnimatedPose draws it. Width and height reserve the box (CLS 0). Renders nothing for a pose that
 * has no exported still, so there is never a broken image.
 */
export function PoseImage({ pose, ...rest }: { pose: PoseKey } & Omit<AnimatedPoseProps, 'image'>) {
  return <AnimatedPose image={poseImage(pose)} {...rest} />
}
