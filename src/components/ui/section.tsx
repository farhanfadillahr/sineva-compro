import type { ComponentProps, ElementType } from 'react'
import { cx } from './cx'

export type SectionTone = 'canvas' | 'alt' | 'tint' | 'warm' | 'inverse' | 'aurora'

// docs/design/components.md section 13. Alternate canvas/alt/tint/warm down a page. Use `inverse`
// at most once per page (closing CTA or footer). `aurora` is the soft gradient for hero and CTA
// backgrounds; it stays a light surface, so body text keeps the default colours.
export const sectionToneClasses: Record<SectionTone, string> = {
  canvas: 'bg-canvas',
  alt: 'bg-canvas-alt',
  tint: 'bg-surface-tint',
  warm: 'bg-surface-warm',
  inverse: 'bg-surface-inverse text-text-inverse',
  aurora: 'bg-canvas bg-(image:--gradient-aurora)',
}

type SectionProps = ComponentProps<'section'> & {
  as?: 'section' | 'div' | 'header' | 'footer' | 'aside'
  tone?: SectionTone
}

// The full-bleed band only. Put a <Container> inside for the content width, because hero sections
// need a different container size and some bands are intentionally edge to edge.
export function Section({
  as = 'section',
  tone = 'canvas',
  className,
  children,
  ...rest
}: SectionProps) {
  const Tag = as as ElementType
  return (
    <Tag
      {...rest}
      data-tone={tone}
      className={cx('py-(--section-y)', sectionToneClasses[tone], className)}
    >
      {children}
    </Tag>
  )
}
