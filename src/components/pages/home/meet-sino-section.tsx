import { Reveal } from '@/components/motion/Reveal'
import { SinoStage } from '@/components/sections'
import { Container, Section, SectionHeader, type SectionTone } from '@/components/ui'
import { PoseImage } from './pose-image'

/**
 * "Meet Sino" (page-patterns.md 2.1 row 3): a centred intro and a still of Sino on his stage.
 * The scroll-scrubbed scene of motion.md section 4.3 is a later decision (sprite sequence or GLB
 * scrub); this still reserves the same box, so adding it does not move the page.
 */
export function MeetSinoSection({
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
      <Container className="flex flex-col gap-12">
        <Reveal>
          <SectionHeader title={title} lead={body} />
        </Reveal>
        <Reveal>
          <SinoStage className="max-w-sm">
            <PoseImage
              pose="headshot"
              sizes="(min-width: 640px) 384px, 90vw"
              className="size-full object-contain"
            />
          </SinoStage>
        </Reveal>
      </Container>
    </Section>
  )
}
