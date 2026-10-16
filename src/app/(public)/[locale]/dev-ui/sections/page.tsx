import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  AudienceCards,
  ChatBubbles,
  FaqSection,
  FinalCta,
  HeroSplit,
  PhoneFrame,
  StickyCtaBar,
  StickySteps,
  TaskCardGrid,
  TwoPaths,
  faqEntriesFromDto,
} from '@/components/sections'
import { Container, Eyebrow, Section, SectionHeader } from '@/components/ui'
import { publicFixtures } from '../../../../../../tests/fixtures/public'
import { placeholderIcons, placeholderPose, placeholderScene } from './placeholders'

// Developer gallery of the shared section blocks (src/components/sections), rendered with the
// fixture content. Like /dev-ui it does not exist in production: the page returns 404 there. It is
// not a real page, so the tones do not follow the page rules (one h1, alternating tones); each
// block sits under a label and the heroes use h2 headings.
//
// The sticky CTA bar only shows below 1024 px, after the first hero CTA has scrolled away.
const home = publicFixtures.pages.home
const product = publicFixtures.pages.product
const capabilities = publicFixtures.capabilities
const settings = publicFixtures.siteSettings

const faqItems = faqEntriesFromDto(
  publicFixtures.faq.filter((entry) => entry.tags.includes('home')).map((entry) => entry.item),
)

function Label({ children }: { children: ReactNode }) {
  return (
    <div className="bg-canvas-alt py-3">
      <Container>
        <Eyebrow>{children}</Eyebrow>
      </Container>
    </div>
  )
}

const stepScreens = capabilities.map((capability) => (
  <PhoneFrame key={capability.key}>
    <ChatBubbles
      bubbles={capability.mockupLines.map((text, index) => ({
        from: index % 2 === 0 ? ('user' as const) : ('sino' as const),
        text,
      }))}
    />
  </PhoneFrame>
))

export default function SectionsGalleryPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  const hero = {
    eyebrow: home.hero.eyebrow,
    headline: home.hero.headline,
    headingAs: 'h2' as const,
    lead: home.hero.lead,
    primaryCta: { label: home.hero.primaryCtaLabel, href: '/contact' },
    secondaryCta: { label: home.hero.secondaryCtaLabel ?? '', href: '/products/ai-agents' },
  }

  return (
    <main>
      <Section tone="canvas">
        <Container>
          <SectionHeader
            titleAs="h1"
            align="start"
            eyebrow="Dev only"
            title="Section blocks"
            lead="Every block from src/components/sections with fixture copy and placeholder art. Resize below 1024 px to see the sticky CTA bar after the first hero CTA scrolls away."
          />
        </Container>
      </Section>

      <Label>HeroSplit / sino-still</Label>
      <HeroSplit
        {...hero}
        variant="sino-still"
        ctaId="gallery-hero-cta"
        image={placeholderPose('Sino waving')}
        priority
      />

      <Label>HeroSplit / sino-canvas (poster, canvas slot reserved)</Label>
      <HeroSplit
        {...hero}
        variant="sino-canvas"
        ctaId="gallery-hero-canvas-cta"
        image={placeholderPose('Sino poster')}
        canvas={
          <div className="grid size-full place-items-center">
            <span className="rounded-pill bg-surface px-3 py-1 font-mono text-micro text-text-secondary shadow-sm">
              canvas slot
            </span>
          </div>
        }
      />

      <Label>HeroSplit / mockup</Label>
      <HeroSplit
        {...hero}
        variant="mockup"
        ctaId="gallery-hero-mockup-cta"
        mockup={product.hero.mockup}
      />

      <Label>HeroSplit / scene</Label>
      <HeroSplit
        {...hero}
        variant="scene"
        ctaId="gallery-hero-scene-cta"
        image={placeholderScene('Team at work')}
        reverse
      />

      <Label>TwoPaths</Label>
      <TwoPaths
        locale="en"
        product={{
          ...home.twoPaths.product,
          badge: 'Coming soon',
          cta: { label: home.twoPaths.product.ctaLabel, href: '/products/ai-agents' },
          image: placeholderPose('Sino holding a phone', 480, 560),
        }}
        services={{
          ...home.twoPaths.services,
          cta: { label: home.twoPaths.services.ctaLabel, href: '/services' },
          image: placeholderPose('Sino stacking building blocks', 480, 560),
        }}
      />

      <Label>TaskCardGrid (bento, phone mockups and poses)</Label>
      <TaskCardGrid
        title={home.capabilities.title}
        intro={home.capabilities.intro}
        tone="tint"
        items={capabilities.map((capability, index) => ({
          ...capability,
          image: index === 2 ? placeholderPose('Sino handing over a note', 480, 400) : null,
        }))}
      />

      <Label>StickySteps</Label>
      <StickySteps
        title={home.howWeWork.title}
        tone="alt"
        steps={home.howWeWork.steps.map((step, index) => ({
          ...step,
          screen: stepScreens[index % stepScreens.length],
        }))}
      />

      <Label>AudienceCards</Label>
      <AudienceCards
        title={home.whoWeHelp.title}
        items={home.whoWeHelp.cards}
        icons={placeholderIcons}
      />

      <Label>FaqSection (with FAQPage JSON-LD)</Label>
      <FaqSection
        title={home.faq.title}
        intro={home.faq.intro}
        items={faqItems}
        cta={{ label: 'Talk to us', href: '/contact' }}
        tone="alt"
        jsonLd
      />

      <Label>FinalCta (the one inverse section)</Label>
      <FinalCta
        headline={home.finalCta.headline}
        body={home.finalCta.body}
        primaryCta={{ label: home.finalCta.primaryCtaLabel, href: '/contact' }}
        secondaryCta={{ label: home.finalCta.secondaryCtaLabel ?? '', href: '/products/ai-agents' }}
        whatsappCta={{
          label: home.finalCta.whatsappCtaLabel,
          href: `https://wa.me/${settings.whatsapp.number.replace('+', '')}`,
        }}
        image={placeholderPose('Sino waving', 480, 480)}
      />

      <StickyCtaBar
        label="Next steps"
        primaryCta={{ label: home.hero.primaryCtaLabel, href: '/contact' }}
        whatsappCta={{
          label: home.finalCta.whatsappCtaLabel,
          href: `https://wa.me/${settings.whatsapp.number.replace('+', '')}`,
        }}
        heroTargetId="gallery-hero-cta"
        endTargetId="final-cta"
      />
    </main>
  )
}
