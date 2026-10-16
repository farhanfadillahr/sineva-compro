import { Reveal } from '@/components/motion/Reveal'
import { SinoStage } from '@/components/sections'
import { Container, Section, SectionHeader, type SectionTone } from '@/components/ui'
import type { PoseKey } from '@/features/content/types'
import { PoseImage } from '../home/pose-image'

/**
 * "Meet Sino" on About (page-patterns.md 2.7): Sino's role as a friendly companion, with a still on its
 * stage. Home has its own Meet Sino with a fixed pose; this one takes the pose so the About hero
 * and this section never show the same picture.
 */
export function AboutMeetSinoSection({
  title,
  body,
  pose,
  tone,
}: {
  title: string
  body: string
  pose: PoseKey
  tone: SectionTone
}) {
  return (
    // The stage glow and orbit arcs extend past the stage box; clip them sideways so they never
    // add a horizontal scrollbar on a phone.
    <Section tone={tone} className="overflow-x-clip">
      <Container className="flex flex-col gap-12">
        <Reveal variant="lines">
          <SectionHeader title={title} lead={body} />
        </Reveal>
        <Reveal>
          <SinoStage className="max-w-sm">
            <PoseImage
              pose={pose}
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
