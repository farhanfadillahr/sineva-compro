import type { RevealState } from '../../lib/motion/use-reveal'
import type { RevealVariant } from '../../lib/motion/tokens'
import styles from './Reveal.module.css'

const VARIANT_CLASS: Record<RevealVariant, string | undefined> = {
  rise: styles.rise,
  lines: styles.lines,
  depth: styles.depth,
  clip: styles.clip,
  'rise-scale': styles.riseScale,
}

const STATE_CLASS: Partial<Record<RevealState, string>> = {
  hidden: styles.hidden,
  shown: styles.shown,
}

/** Variant class always, state class only while the block waits or plays. */
export function revealClassName(
  variant: RevealVariant,
  state: RevealState,
  className?: string,
): string | undefined {
  return (
    [className, VARIANT_CLASS[variant], STATE_CLASS[state]].filter(Boolean).join(' ') || undefined
  )
}
