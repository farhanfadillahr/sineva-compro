import type { ComponentProps, ReactNode } from 'react'
import { cx } from './cx'
import { Eyebrow } from './eyebrow'

type SectionHeaderProps = Omit<ComponentProps<'div'>, 'title'> & {
  eyebrow?: ReactNode
  title: ReactNode
  lead?: ReactNode
  // Optional CTA below the lead (a Button).
  action?: ReactNode
  align?: 'center' | 'start'
  // Heading level. A page has one h1; section titles are h2.
  titleAs?: 'h1' | 'h2' | 'h3'
  // Light text for use inside `Section tone="inverse"`.
  inverse?: boolean
}

// Eyebrow, title, lead and optional CTA (components.md section 13). `text-balance` evens out line
// lengths toward the "max 16 characters per line" target without hard line breaks in copy.
export function SectionHeader({
  eyebrow,
  title,
  lead,
  action,
  align = 'center',
  titleAs: Title = 'h2',
  inverse = false,
  className,
  ...rest
}: SectionHeaderProps) {
  const centered = align === 'center'
  return (
    <div
      {...rest}
      className={cx(
        'flex flex-col gap-4',
        centered ? 'items-center text-center' : 'items-start text-start',
        className,
      )}
    >
      {eyebrow ? <Eyebrow tone={inverse ? 'inverse' : 'brand'}>{eyebrow}</Eyebrow> : null}
      <Title className={cx('text-h2 text-balance', inverse ? 'text-text-inverse' : 'text-text')}>
        {title}
      </Title>
      {lead ? (
        <p
          className={cx(
            'max-w-[65ch] text-lead text-pretty',
            inverse ? 'text-text-inverse' : 'text-text-secondary',
          )}
        >
          {lead}
        </p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
