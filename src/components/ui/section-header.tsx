import type { ComponentProps, ReactNode } from 'react'
import { ScrollRule } from '../motion/ScrollRule'
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
  // A hairline under the header that draws with scroll (motion.md 4.1). Opt in per section.
  rule?: boolean
}

// Eyebrow, title, lead and optional CTA (components.md section 13). `text-balance` evens out line
// lengths toward the "max 16 characters per line" target without hard line breaks in copy.
// `data-reveal-part` is how `<Reveal variant="lines">` finds the pieces: it splits the title into
// lines and fades the others in after it.
export function SectionHeader({
  eyebrow,
  title,
  lead,
  action,
  align = 'center',
  titleAs: Title = 'h2',
  inverse = false,
  rule = false,
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
      {eyebrow ? (
        <Eyebrow data-reveal-part="eyebrow" tone={inverse ? 'inverse' : 'brand'}>
          {eyebrow}
        </Eyebrow>
      ) : null}
      <Title
        data-reveal-part="title"
        className={cx('text-h2 text-balance', inverse ? 'text-text-inverse' : 'text-text')}
      >
        {title}
      </Title>
      {lead ? (
        <p
          data-reveal-part="lead"
          className={cx(
            'max-w-[65ch] text-lead text-pretty',
            inverse ? 'text-text-inverse' : 'text-text-secondary',
          )}
        >
          {lead}
        </p>
      ) : null}
      {action ? (
        <div data-reveal-part="action" className="mt-2">
          {action}
        </div>
      ) : null}
      {rule ? <ScrollRule className="mt-4" /> : null}
    </div>
  )
}
