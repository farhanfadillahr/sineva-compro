import { Button, Container, Section, SectionHeader, type SectionTone } from '@/components/ui'
import { FaqAccordion } from './_internal/faq-accordion'
import { buildFaqPageJsonLd, serializeJsonLd, type FaqEntry } from './_internal/faq'
import type { CtaLink, LinkProps } from './_internal/types'

export type FaqSectionProps = LinkProps & {
  eyebrow?: string | null
  title: string
  intro?: string | null
  items: readonly FaqEntry[]
  /** Optional CTA under the intro in the left column, for example "Talk to us". */
  cta?: CtaLink | null
  /**
   * Also emit the questions as FAQPage JSON-LD. Only turn it on where the PRD asks for it (Home,
   * Product, Services, Service detail), and only when the visible answers match the text.
   */
  jsonLd?: boolean
  tone?: SectionTone
}

/**
 * FAQ band (page-patterns.md 2.1 row 9, components.md section 7): title, intro and CTA on the
 * left, accordion on the right from lg up, stacked below. The accordion is the only client
 * component; the JSON-LD is rendered here on the server. Renders nothing, JSON-LD included, for
 * an empty list.
 */
export function FaqSection({
  eyebrow,
  title,
  intro,
  items,
  cta,
  jsonLd = false,
  tone = 'canvas',
  linkComponent,
}: FaqSectionProps) {
  if (items.length === 0) return null
  return (
    <Section tone={tone}>
      <Container>
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeader
              align="start"
              eyebrow={eyebrow}
              title={title}
              lead={intro}
              action={
                cta ? (
                  <Button
                    href={cta.href}
                    linkComponent={linkComponent}
                    variant="secondary"
                    size="lg"
                  >
                    {cta.label}
                  </Button>
                ) : undefined
              }
            />
          </div>
          <div className="lg:col-span-7">
            <FaqAccordion items={items.map(({ question, answer }) => ({ question, answer }))} />
          </div>
        </div>
      </Container>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildFaqPageJsonLd(items)) }}
        />
      ) : null}
    </Section>
  )
}
