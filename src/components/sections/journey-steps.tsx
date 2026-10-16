import { Reveal } from '@/components/motion/Reveal'
import { Container, Section, SectionHeader, type SectionTone } from '@/components/ui'
import type { StepItem } from '@/features/content/types'
import { PoseImage } from '@/components/pages/home/pose-image'
import { HOW_WE_WORK_POSES } from '@/components/pages/home/poses'

/** A calm, illustrated path. Native reading order stays the same at every viewport and motion setting. */
export function JourneySteps({
  title,
  steps,
  tone = 'alt',
}: {
  title: string
  steps: readonly StepItem[]
  tone?: SectionTone
}) {
  if (steps.length === 0) return null
  return (
    <Section tone={tone}>
      <Container className="flex flex-col gap-12">
        <SectionHeader title={title} />
        <ol data-slot="journey-steps" className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <li
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-16 top-24 hidden h-12 lg:block"
          >
            <svg
              viewBox="0 0 1000 80"
              preserveAspectRatio="none"
              className="size-full text-border-strong"
              fill="none"
            >
              <path
                d="M0 40 C120 -10 210 90 330 40 S550 -10 670 40 S880 90 1000 40"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="5 9"
              />
            </svg>
          </li>
          {steps.map((step, index) => (
            <Reveal
              as="li"
              key={step.title}
              index={index}
              className="relative flex flex-col items-center gap-5 rounded-xl bg-surface p-6 text-center shadow-sm [border:var(--border-hairline)]"
            >
              <div className="relative size-40 rounded-full bg-surface-tint">
                <PoseImage
                  pose={HOW_WE_WORK_POSES[index % HOW_WE_WORK_POSES.length]!}
                  sizes="160px"
                  fit="contain"
                  className="size-full object-contain"
                />
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="text-h4 text-balance text-text">{step.title}</h3>
                <p className="text-body-sm text-pretty text-text-secondary">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  )
}
