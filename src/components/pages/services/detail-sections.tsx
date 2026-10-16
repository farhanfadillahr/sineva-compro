import { Reveal } from '@/components/motion/Reveal'
import { Card, Container, Section, SectionHeader, type SectionTone } from '@/components/ui'
import type { CardItem, StepItem } from '@/features/content/types'

type Common = { title: string; tone: SectionTone }

function CheckGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  )
}

/** "Problems we solve" (page-patterns.md 2.4): three or four `card-feature` cards. */
export function ProblemsSection({ title, items, tone }: Common & { items: readonly CardItem[] }) {
  if (items.length === 0) return null
  // Four cards fill a desktop row; three would leave a gap in four columns, so they use three.
  const columns = items.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'
  return (
    <Section tone={tone}>
      <Container className="flex flex-col gap-12">
        <Reveal variant="lines">
          <SectionHeader title={title} />
        </Reveal>
        <ul className={`grid grid-cols-1 gap-4 ${columns}`}>
          {items.map((item) => (
            <Reveal as="li" variant="depth" key={item.title} className="flex">
              <Card variant="feature" className="w-full">
                <h3 className="text-h4 text-text">{item.title}</h3>
                <p className="text-body-sm text-pretty text-text-secondary">{item.body}</p>
              </Card>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  )
}

/** "What you get": the deliverables as a check list next to the heading. */
export function DeliverablesSection({ title, items, tone }: Common & { items: readonly string[] }) {
  if (items.length === 0) return null
  return (
    <Section tone={tone}>
      <Container className="grid grid-cols-1 items-start gap-x-8 gap-y-10 lg:grid-cols-12">
        <Reveal variant="lines" className="lg:col-span-5">
          <SectionHeader align="start" title={title} />
        </Reveal>
        <Reveal className="lg:col-span-7" delayMs={80}>
          <Card variant="base" tone="surface">
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-3 text-body text-text">
                  <span
                    data-slot="check"
                    className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-pill bg-surface-tint text-text-brand"
                  >
                    <CheckGlyph />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      </Container>
    </Section>
  )
}

/**
 * Compact process (page-patterns.md 2.4): the service's own steps in a row. Not the sticky
 * scroll story of the overview, which this page does not repeat.
 */
export function ProcessSection({ title, steps, tone }: Common & { steps: readonly StepItem[] }) {
  if (steps.length === 0) return null
  return (
    <Section tone={tone}>
      <Container className="flex flex-col gap-12">
        <Reveal variant="lines">
          <SectionHeader title={title} />
        </Reveal>
        <ol className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Reveal as="li" variant="depth" key={step.title} className="flex">
              <Card variant="feature" tone="surface" className="w-full">
                <span aria-hidden="true" className="font-mono text-eyebrow text-text-brand">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="text-h4 text-text">{step.title}</h3>
                <p className="text-body-sm text-pretty text-text-secondary">{step.body}</p>
              </Card>
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  )
}

/**
 * "Tools we use": text chips only, no logos and no vendor claims. Tool names are not localised
 * and stay as written.
 */
export function ToolsSection({ title, tools, tone }: Common & { tools: readonly string[] }) {
  if (tools.length === 0) return null
  return (
    <Section tone={tone}>
      <Container className="flex flex-col gap-10">
        <Reveal variant="lines">
          <SectionHeader title={title} />
        </Reveal>
        <Reveal delayMs={80}>
          <ul className="flex flex-wrap justify-center gap-3">
            {tools.map((tool) => (
              <li
                key={tool}
                className="rounded-pill bg-canvas-alt px-5 py-2.5 text-label text-text [border:var(--border-hairline)]"
              >
                {tool}
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </Section>
  )
}
