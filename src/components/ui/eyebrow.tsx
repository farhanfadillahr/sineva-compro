import type { ComponentProps } from 'react'
import { cx } from './cx'

type EyebrowProps = ComponentProps<'p'> & {
  as?: 'p' | 'span' | 'div'
  // `inverse` for dark sections: brand teal on --color-surface-inverse fails contrast.
  tone?: 'brand' | 'inverse'
  // Optional leading 6 px dot (components.md section 5).
  dot?: boolean
}

// Geist Mono 12 px, uppercase, 0.08em tracking. Section label above a heading.
export function Eyebrow({
  as: Tag = 'p',
  tone = 'brand',
  dot = false,
  className,
  children,
  ...rest
}: EyebrowProps) {
  return (
    <Tag
      {...rest}
      className={cx(
        'inline-flex items-center gap-2 font-mono text-eyebrow uppercase',
        tone === 'inverse' ? 'text-text-inverse' : 'text-text-brand',
        className,
      )}
    >
      {dot ? (
        <span
          data-slot="dot"
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-pill bg-current"
        />
      ) : null}
      {children}
    </Tag>
  )
}
