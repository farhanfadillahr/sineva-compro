import { Reveal } from '@/components/motion/Reveal'
import { ScrollScrubSequence } from '@/components/motion/ScrollScrubSequence'
import { SinoStage } from '@/components/sections'
import { Container, Section, SectionHeader, type SectionTone } from '@/components/ui'
import { SINO_LOOK_UP } from './sino-look-up'

/**
 * "Meet Sino" (page-patterns.md 2.1 row 3): a centred intro and Sino on his stage. This is the page's
 * scroll-scrubbed scene (motion.md section 4.3): Sino starts with the head bowed and lifts his face
 * to the visitor as the section scrolls into view, and bows again when scrolling back.
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
        <Reveal variant="lines">
          <SectionHeader title={title} lead={body} />
        </Reveal>
        <Reveal>
          <SinoStage className="max-w-sm">
            <ScrollScrubSequence {...SINO_LOOK_UP} className="size-full" />
          </SinoStage>
        </Reveal>
      </Container>
    </Section>
  )
}
