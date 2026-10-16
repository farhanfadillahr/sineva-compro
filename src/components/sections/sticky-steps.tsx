import type { ReactNode } from 'react'
import { Container, Section, SectionHeader, type SectionTone } from '@/components/ui'
import type { StepItem } from '@/features/content/types'
import { StickyStepsStory } from './_internal/sticky-steps-story'

/** A step of the story: the content DTO plus the screen shown in the sticky column. */
export type StickyStep = StepItem & Readonly<{ screen?: ReactNode }>

export type StickyStepsProps = {
  eyebrow?: string | null
  title: string
  intro?: string | null
  steps: readonly StickyStep[]
  tone?: SectionTone
}

/**
 * "How we work" and "How it works" (motion.md section 4.2): a sticky screen column and the
 * steps. The screens are HTML built by the page (a `PhoneFrame` with `ChatBubbles`, for
 * example), never images with text. The client component does the work; see StickySteps story
 * for the GSAP loading rules. Renders nothing for no steps.
 *
 * Gotcha: this block counts as one scroll-driven element on the page. motion.md section 4.3
 * allows one scroll-scrubbed scene per page and does not say whether the step story counts; on a
 * page that also has the Home "Meet Sino" scene, confirm with the product owner before shipping
 * both.
 */
export function StickySteps({ eyebrow, title, intro, steps, tone = 'alt' }: StickyStepsProps) {
  if (steps.length === 0) return null
  return (
    <Section tone={tone}>
      <Container className="flex flex-col gap-12">
        <SectionHeader eyebrow={eyebrow} title={title} lead={intro} />
        <StickyStepsStory steps={steps} />
      </Container>
    </Section>
  )
}
