import { Reveal } from '@/components/motion/Reveal'
import { Container, Section, SectionHeader, type SectionTone } from '@/components/ui'
import type { Industry } from '@/features/content/types'
import { IndustryTabs } from './industry-tabs'

type MadeForYouSectionProps = {
  title: string
  intro?: string | null
  /** Accessible name of the tab list. */
  tabsLabel: string
  items: readonly Industry[]
  tone?: SectionTone
}

/**
 * "Made for your business" (page-patterns.md 2.2 row 4): an intro and a segmented control with
 * one example day per business type. Renders nothing for an empty list, so a heading never sits
 * over an empty control.
 */
export function MadeForYouSection({
  title,
  intro,
  tabsLabel,
  items,
  tone = 'canvas',
}: MadeForYouSectionProps) {
  if (items.length === 0) return null
  return (
    <Section tone={tone}>
      <Container className="flex flex-col gap-12">
        <Reveal>
          <SectionHeader title={title} lead={intro} />
        </Reveal>
        <Reveal delayMs={80}>
          <IndustryTabs label={tabsLabel} items={items} />
        </Reveal>
      </Container>
    </Section>
  )
}
