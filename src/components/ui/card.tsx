import type { ComponentProps, ElementType } from 'react'
import { cx } from './cx'

export type CardVariant = 'base' | 'path' | 'task' | 'feature' | 'work' | 'post' | 'stat' | 'step'
export type CardTone = 'surface' | 'tint' | 'warm' | 'alt' | 'none'

const HAIRLINE = '[border:var(--border-hairline)]'

// docs/design/components.md section 4. Structure only (radius, padding, overflow, border); the
// surface colour comes from `tone` so the same card can be tinted per capability or per path.
// Card contents (Sino pose, cover image, number) are the caller's children.
export const cardVariantClasses: Record<CardVariant, string> = {
  base: cx('rounded-card p-6 lg:p-8', HAIRLINE),
  // Home two-path cards: large radius, tall, a pose bleeds off the bottom right.
  path: cx('relative min-h-[420px] overflow-hidden rounded-xl p-6 lg:p-8', HAIRLINE),
  // Capability cards: tinted per capability, a phone mockup or pose bleeds off the bottom edge.
  task: cx('relative overflow-hidden rounded-xl p-6 lg:p-8', HAIRLINE),
  feature: cx('flex flex-col gap-4 rounded-card p-6', HAIRLINE),
  // Portfolio and blog cards are media first: no padding, the cover touches the edges and the
  // text block adds its own padding.
  work: cx('group/card flex flex-col overflow-hidden rounded-card p-0', HAIRLINE),
  post: cx('group/card flex flex-col overflow-hidden rounded-card p-0', HAIRLINE),
  stat: cx('flex flex-col gap-1 rounded-card p-6 tabular-nums', HAIRLINE),
  step: 'flex gap-4',
}

const DEFAULT_TONE: Record<CardVariant, CardTone> = {
  base: 'surface',
  path: 'tint',
  task: 'tint',
  feature: 'surface',
  work: 'surface',
  post: 'surface',
  stat: 'surface',
  step: 'none',
}

export const cardToneClasses: Record<CardTone, string> = {
  surface: 'bg-surface',
  tint: 'bg-surface-tint',
  warm: 'bg-surface-warm',
  alt: 'bg-canvas-alt',
  none: '',
}

// Cards that rest on the page get the default shadow; step has none; the featured card swaps it
// for the teal glow.
const RESTING_SHADOW: Partial<Record<CardVariant, string>> = {
  base: 'shadow-sm',
  work: 'shadow-sm',
  post: 'shadow-sm',
}

type CardProps = ComponentProps<'div'> & {
  as?: 'div' | 'article' | 'li' | 'section' | 'aside'
  variant?: CardVariant
  tone?: CardTone
  // `--shadow-glow` on the one featured card of a group (task cards).
  featured?: boolean
  // The whole card is a click target (a stretched link inside it): lift 4 px and deepen the shadow
  // on hover, ring on keyboard focus. Only transform and shadow animate (motion.md section 10).
  interactive?: boolean
}

export function Card({
  as = 'div',
  variant = 'base',
  tone,
  featured = false,
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  const Tag = as as ElementType
  return (
    <Tag
      {...rest}
      data-variant={variant}
      className={cx(
        cardVariantClasses[variant],
        cardToneClasses[tone ?? DEFAULT_TONE[variant]],
        featured ? 'shadow-glow' : RESTING_SHADOW[variant],
        interactive &&
          cx(
            'transition-[translate,box-shadow] duration-(--dur-med) ease-out motion-reduce:transition-none',
            'hover:-translate-y-1',
            !featured && 'hover:shadow-md',
            // :has(:focus-visible) rings the card only for keyboard focus on a child. Plain
            // focus-within would also ring it after a mouse click on the inner link.
            'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus',
          ),
        className,
      )}
    >
      {children}
    </Tag>
  )
}
