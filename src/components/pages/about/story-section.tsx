import { RichText } from '@/components/content/rich-text'
import { Reveal } from '@/components/motion/Reveal'
import { Container, Section, type ActionLinkComponent, type SectionTone } from '@/components/ui'
import type { RichTextDocument } from '@/features/content/types'

export function StorySection({
  document,
  tone,
  linkComponent,
}: {
  document: RichTextDocument
  tone: SectionTone
  linkComponent?: ActionLinkComponent
}) {
  return (
    <Section tone={tone}>
      <Container size="text">
        <Reveal>
          <RichText document={document} linkComponent={linkComponent} />
        </Reveal>
      </Container>
    </Section>
  )
}
