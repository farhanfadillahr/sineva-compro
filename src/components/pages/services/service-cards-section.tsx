import { Reveal } from '@/components/motion/Reveal'
import {
  Button,
  Card,
  Container,
  Section,
  SectionHeader,
  type ActionLinkComponent,
  type SectionTone,
} from '@/components/ui'
import type { CardTone } from '@/components/ui/card'
import type { ServiceSummary } from '@/features/content/types'
import { PoseImage } from '../home/pose-image'
import { serviceDetailHref } from './services-model'

// One tint per card so the three services read as three, not as one repeated block.
const CARD_TONES: readonly CardTone[] = ['tint', 'warm', 'alt']

/**
 * The three services as large cards (page-patterns.md 2.3 row 2). The summary already opens with
 * "For ..." (who it is for), so it is the "who it is for" line. The pose sits at the bottom of the
 * card, and the card is a column so the CTA stays above it whatever the text length.
 */
export function ServiceCardsSection({
  title,
  intro,
  services,
  ctaLabel,
  tone,
  linkComponent,
}: {
  title: string
  intro: string
  services: readonly ServiceSummary[]
  ctaLabel: (name: string) => string
  tone: SectionTone
  linkComponent?: ActionLinkComponent
}) {
  if (services.length === 0) return null
  return (
    <Section tone={tone}>
      <Container size="wide" className="flex flex-col gap-12">
        <Reveal variant="lines">
          <SectionHeader title={title} lead={intro} rule />
        </Reveal>
        <ul className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {services.map((service, index) => (
            <Reveal as="li" variant="depth" key={service.slug} className="flex">
              <Card
                as="article"
                variant="path"
                tone={CARD_TONES[index % CARD_TONES.length]}
                data-service-card={service.slug}
                className="flex w-full flex-col items-start gap-4"
              >
                <h3 className="text-h3 text-balance text-text">{service.title}</h3>
                <p className="text-body text-pretty text-text-secondary">{service.summary}</p>
                <Button
                  href={serviceDetailHref(service.slug)}
                  linkComponent={linkComponent}
                  variant="secondary"
                  size="lg"
                  withArrow
                  className="mt-2"
                >
                  {ctaLabel(service.title)}
                </Button>
                <div
                  data-slot="service-pose"
                  className="pointer-events-none mt-auto ms-auto w-3/5 max-w-56 pt-6"
                >
                  <PoseImage
                    pose={service.pose}
                    sizes="(min-width: 1024px) 18vw, 50vw"
                    className="h-auto w-full"
                  />
                </div>
              </Card>
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  )
}
