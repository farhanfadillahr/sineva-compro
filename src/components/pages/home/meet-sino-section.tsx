import { Reveal } from '@/components/motion/Reveal'
import { SinoLoop } from '@/components/motion/sino-loop'
import { SinoStage } from '@/components/sections'
import { Container, Section, SectionHeader, type SectionTone } from '@/components/ui'
import { poseImage } from './poses'

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
    // The stage glow and orbit arcs extend past the stage box; clip them sideways so they never
    // add a horizontal scrollbar on a phone (the hero does the same).
    <Section tone={tone} className="overflow-x-clip">
      <Container className="flex flex-col gap-12">
        <Reveal>
          <SectionHeader title={title} lead={body} />
        </Reveal>
        <Reveal>
          <SinoStage className="max-w-sm">
            <SinoLoop
              loop="L-wave"
              still={poseImage('relaxed-mug')}
              sizes="(min-width: 640px) 384px, 90vw"
              fit="contain"
              className="size-full"
            />
          </SinoStage>
        </Reveal>
      </Container>
    </Section>
  )
}
