import type { ComponentProps } from 'react'
import { cx } from './cx'

export type BadgeTone = 'brand' | 'warm' | 'neutral' | 'success' | 'danger'

// docs/design/components.md section 5. Each tone pairs a tinted background with a text colour whose
// contrast is verified in tokens.md section 1.3 (brand and danger/success on their tint).
export const badgeToneClasses: Record<BadgeTone, string> = {
  brand: 'bg-surface-tint text-text-brand',
  warm: 'bg-surface-warm text-text',
  neutral: 'bg-canvas-alt text-text-secondary',
  success: 'bg-success-surface text-success',
  danger: 'bg-danger-surface text-danger',
}

type BadgeProps = ComponentProps<'span'> & {
  tone?: BadgeTone
  // "Coming soon" badge: adds a small pulsing dot. The pulse stops under reduced motion.
  soon?: boolean
}

export function Badge({ tone = 'brand', soon = false, className, children, ...rest }: BadgeProps) {
  return (
    <span
      {...rest}
      data-tone={tone}
      className={cx(
        'inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xs px-2',
        'text-[0.75rem] font-medium leading-none',
        badgeToneClasses[tone],
        className,
      )}
    >
      {soon ? (
        <span
          data-slot="dot"
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-pill bg-current animate-dot-pulse motion-reduce:animate-none"
        />
      ) : null}
      {children}
    </span>
  )
}
