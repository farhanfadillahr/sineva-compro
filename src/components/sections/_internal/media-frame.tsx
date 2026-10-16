import type { ComponentProps } from 'react'
import { cx } from '@/components/ui/cx'

type MediaFrameProps = ComponentProps<'div'> & {
  /** Thin white sheen across the top (`--gradient-card-sheen`). */
  sheen?: boolean
}

/** `media-frame` (components.md section 10): radius xl, hairline border, optional card sheen. */
export function MediaFrame({ sheen = true, className, children, ...rest }: MediaFrameProps) {
  return (
    <div
      {...rest}
      data-slot="media-frame"
      className={cx(
        'relative overflow-hidden rounded-xl bg-surface shadow-md [border:var(--border-hairline)]',
        className,
      )}
    >
      {children}
      {sheen ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-(image:--gradient-card-sheen)"
        />
      ) : null}
    </div>
  )
}
