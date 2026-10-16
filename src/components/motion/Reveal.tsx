'use client'

import type { ComponentPropsWithoutRef, ElementType } from 'react'
import type { RevealVariant } from '../../lib/motion/tokens'
import { useReveal } from '../../lib/motion/use-reveal'
import { revealClassName } from './reveal-class'
import { ScrubReveal } from './ScrubReveal'

type RevealOwnProps = {
  /** Element to render. */
  as?: ElementType
  /**
   * Which scroll preset plays (motion.md 4.1). Pick by the role of the element:
   * - `rise` (default): text blocks, forms, anything without a better role.
   * - `lines`: a section header (wrap `SectionHeader`). The title rises line by line out of a mask,
   *   the eyebrow, lead and action follow.
   * - `depth`: a card, alone or in a grid. Staggers by arrival; `index` is ignored.
   * - `clip`: a picture, phone or frame that has no animation of its own. Not for `AnimatedPose`,
   *   which reveals itself.
   * - `rise-scale`: the final CTA panel, scrubbed with scroll (GSAP, loaded on demand).
   */
  variant?: RevealVariant
  /** Position among siblings (0-based). 50 ms per step, the sixth and later start together. */
  index?: number
  /** Explicit delay in ms, overrides `index`. */
  delayMs?: number
  threshold?: number
}

export type RevealProps = RevealOwnProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof RevealOwnProps>

/**
 * A scroll reveal, once. A client component only for the effect: its children can be server
 * components and are rendered into the server HTML in their final state.
 */
export function Reveal({ variant = 'rise', ...props }: RevealProps) {
  return variant === 'rise-scale' ? (
    <ScrubReveal {...props} />
  ) : (
    <PresetReveal variant={variant} {...props} />
  )
}

function PresetReveal({
  as: Tag = 'div',
  variant,
  index,
  delayMs,
  threshold,
  className,
  style,
  children,
  ...rest
}: RevealProps & { variant: RevealVariant }) {
  const { ref, state, props } = useReveal<HTMLElement>({ variant, index, delayMs, threshold })
  return (
    <Tag
      {...rest}
      ref={ref}
      data-reveal={props['data-reveal']}
      data-reveal-variant={props['data-reveal-variant']}
      className={revealClassName(variant, state, className)}
      style={{ ...style, ...props.style }}
      onTransitionEnd={props.onTransitionEnd}
    >
      {children}
    </Tag>
  )
}
