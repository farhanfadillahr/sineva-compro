'use client'

import type { ComponentPropsWithoutRef, ElementType } from 'react'
import { useReveal, type RevealState } from '../../lib/motion/use-reveal'
import styles from './Reveal.module.css'

type RevealOwnProps = {
  /** Element to render. */
  as?: ElementType
  /** Position among siblings (0-based). 50 ms per step, the sixth and later start together. */
  index?: number
  /** Explicit delay in ms, overrides `index`. */
  delayMs?: number
  threshold?: number
}

export type RevealProps = RevealOwnProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof RevealOwnProps>

const STATE_CLASS: Partial<Record<RevealState, string>> = {
  hidden: styles.hidden,
  shown: styles.shown,
}

/**
 * Fade-and-rise on scroll, once. A client component only for the effect: its children can be
 * server components and are rendered into the server HTML in their final state.
 */
export function Reveal({
  as: Tag = 'div',
  index,
  delayMs,
  threshold,
  className,
  style,
  children,
  ...rest
}: RevealProps) {
  const { ref, state, props } = useReveal<HTMLElement>({ index, delayMs, threshold })
  const stateClass = STATE_CLASS[state]
  return (
    <Tag
      {...rest}
      ref={ref}
      data-reveal={props['data-reveal']}
      className={[className, stateClass].filter(Boolean).join(' ') || undefined}
      style={{ ...style, ...props.style }}
      onTransitionEnd={props.onTransitionEnd}
    >
      {children}
    </Tag>
  )
}
