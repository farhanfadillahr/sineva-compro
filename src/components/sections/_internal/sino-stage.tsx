import type { ComponentProps } from 'react'
import { cx } from '@/components/ui/cx'
import styles from './sino-stage.module.css'

type SinoStageProps = ComponentProps<'div'> & {
  /** Width over height of the stage. Match the image so the box is reserved before it loads. */
  aspect?: number
}

/**
 * Glow, orbit arcs and contact shadow around a Sino still or canvas (`sino-stage`, components.md
 * section 10). Server component: all motion is CSS, and the arcs stand still under reduced motion.
 * The children sit above the decoration; they are the only accessible content.
 *
 * Gotcha: the stage reserves its box with `aspect-ratio`, so a canvas swapped in later
 *cannot shift layout (mascot-sino.md section 3). Give `aspect` the poster's width over height.
 */
export function SinoStage({ aspect = 1, className, style, children, ...rest }: SinoStageProps) {
  return (
    <div
      {...rest}
      data-slot="sino-stage"
      className={cx('relative isolate mx-auto w-full', className)}
      style={{ aspectRatio: aspect, ...style }}
    >
      <div data-slot="stage-glow" aria-hidden="true" className={styles.glow} />
      <svg
        data-slot="stage-orbit"
        aria-hidden="true"
        viewBox="0 0 400 400"
        className={styles.orbit}
      >
        {/* Two arcs of the logo's curve at different radii, turning in opposite directions. */}
        <path data-slot="orbit-arc" className={styles.arc} d="M 24 200 A 176 176 0 0 1 276 40" />
        <path
          data-slot="orbit-arc"
          className={cx(styles.arc, styles.arcReverse)}
          d="M 372 220 A 156 156 0 0 1 120 352"
        />
      </svg>
      <div data-slot="contact-shadow" aria-hidden="true" className={styles.shadow} />
      <div className="relative z-10 flex h-full w-full items-end justify-center">{children}</div>
    </div>
  )
}
