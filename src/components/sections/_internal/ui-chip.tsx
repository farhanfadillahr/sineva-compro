import type { CSSProperties, ComponentProps } from 'react'
import { cx } from '@/components/ui/cx'
import styles from './ui-chip.module.css'

type UiChipProps = ComponentProps<'div'> & {
  /** Offset of the float cycle in seconds, so several chips do not move in lockstep. */
  delay?: number
}

/**
 * Floating mini UI card (`ui-chip`): white, radius 14, medium shadow. Position it with
 * `className` (absolute offsets) from the mockup that owns it. The text must describe real
 * product behaviour (copywriting.md rule 2); it comes from props.
 */
export function UiChip({ delay = 0, className, style, children, ...rest }: UiChipProps) {
  return (
    <div
      {...rest}
      data-slot="ui-chip"
      className={cx(
        styles.chip,
        'rounded-md bg-surface px-3.5 py-2 text-micro font-medium text-text shadow-md',
        className,
      )}
      style={{ ...style, '--chip-delay': `${delay}s` } as CSSProperties}
    >
      {children}
    </div>
  )
}
