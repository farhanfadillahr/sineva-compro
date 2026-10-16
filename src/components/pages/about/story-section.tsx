import { Reveal } from '@/components/motion/Reveal'
import { Container, Section, SectionHeader, type SectionTone } from '@/components/ui'
import type { StoryBlock } from './about-model'

/**
 * Company story (page-patterns.md 2.7): a narrow prose column. The story's first heading is the
 * section title; a later heading is a sub-heading inside it, so the outline stays h1, h2, h3.
 */
export function StorySection({
  blocks,
  tone,
}: {
  blocks: readonly StoryBlock[]
  tone: SectionTone
}) {
  const [first, ...rest] = blocks
  const title = first?.kind === 'heading' ? first.text : null
  const body = title === null ? blocks : rest

  return (
    <Section tone={tone}>
      <Container size="text" className="flex flex-col gap-8">
        {title ? (
          <Reveal>
            <SectionHeader title={title} align="start" />
          </Reveal>
        ) : null}
        <Reveal className="flex flex-col gap-5">
          {body.map((block, index) =>
            block.kind === 'heading' ? (
              <h3 key={index} className="mt-4 text-h3 text-balance text-text">
                {block.text}
              </h3>
            ) : (
              <p key={index} className="text-lead text-pretty text-text-secondary">
                {block.text}
              </p>
            ),
          )}
        </Reveal>
      </Container>
    </Section>
  )
}
