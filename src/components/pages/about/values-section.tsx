import { Reveal } from '@/components/motion/Reveal'
import { Card, Container, Section, SectionHeader, type SectionTone } from '@/components/ui'
import type { CardItem } from '@/features/content/types'

/**
 * Values (page-patterns.md 2.7): a header and one `card-feature` per value. AudienceCards does
 * not fit: it needs an icon key per card and the value DTO carries none.
 */
export function ValuesSection({
  title,
  items,
  tone,
}: {
  title: string
  items: readonly CardItem[]
  tone: SectionTone
}) {
  return (
    <Section tone={tone}>
      <Container className="flex flex-col gap-12">
        <Reveal variant="lines">
          <SectionHeader title={title} />
        </Reveal>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {items.map((item, index) => (
            <Reveal as="li" variant="depth" key={`${index}-${item.title}`} className="flex">
              <Card variant="feature" className="w-full">
                <h3 className="text-h4 text-text">{item.title}</h3>
                <p className="text-body-sm text-pretty text-text-secondary">{item.body}</p>
              </Card>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  )
}
