import { Reveal } from '@/components/motion/Reveal'
import { Card, Container, Section, type SectionTone } from '@/components/ui'

/**
 * Mission (page-patterns.md 2.7): one statement card. The mission is a single sentence, so it is
 * set large and centred instead of being a body paragraph; the title is the small label above it.
 */
export function MissionSection({
  title,
  body,
  tone,
}: {
  title: string
  body: string
  tone: SectionTone
}) {
  return (
    <Section tone={tone}>
      <Container size="text">
        <Reveal>
          <Card variant="base" className="flex flex-col items-center gap-4 text-center lg:p-12">
            <h2 className="text-h4 text-text-brand">{title}</h2>
            <p className="text-h2 text-balance text-text">{body}</p>
          </Card>
        </Reveal>
      </Container>
    </Section>
  )
}
