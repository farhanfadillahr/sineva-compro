import type { ReactNode } from 'react'
import { Card, Container, Section, SectionHeader, type SectionTone } from '@/components/ui'
import { Reveal } from '@/components/motion/Reveal'
import type { IconCardItem, IconKey } from '@/features/content/types'

export type AudienceCardsProps = {
  eyebrow?: string | null
  title: string
  intro?: string | null
  /** Title, body and icon key of each card, as stored in the page content. */
  items: readonly IconCardItem[]
  /**
   * Artwork per icon key (a 3D icon or a Lucide glyph). A key without an entry renders no icon
   * tile, so the page can ship before every icon exists.
   */
  icons?: Partial<Record<IconKey, ReactNode>>
  tone?: SectionTone
}

/**
 * "Who we help" (page-patterns.md 2.1 row 6): a header and up to a handful of `card-feature`
 * cards. Renders nothing for an empty list.
 */
export function AudienceCards({
  eyebrow,
  title,
  intro,
  items,
  icons,
  tone = 'canvas',
}: AudienceCardsProps) {
  if (items.length === 0) return null
  return (
    <Section tone={tone}>
      <Container className="flex flex-col gap-12">
        <Reveal variant="lines">
          <SectionHeader eyebrow={eyebrow} title={title} lead={intro} />
        </Reveal>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {items.map((item) => {
            const icon = icons?.[item.icon]
            return (
              <Reveal as="li" variant="depth" key={`${item.icon}-${item.title}`} className="flex">
                <Card variant="feature" className="w-full">
                  {icon ? (
                    <span
                      aria-hidden="true"
                      className="grid size-10 place-items-center rounded-sm bg-surface-tint text-text-brand"
                    >
                      {icon}
                    </span>
                  ) : null}
                  <h3 className="text-h4 text-text">{item.title}</h3>
                  <p className="text-body-sm text-pretty text-text-secondary">{item.body}</p>
                </Card>
              </Reveal>
            )
          })}
        </ul>
      </Container>
    </Section>
  )
}
