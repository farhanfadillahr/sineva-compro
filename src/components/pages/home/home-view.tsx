import { JourneySteps } from '@/components/sections/journey-steps'
import type { ReactNode } from 'react'
import {
  AudienceCards,
  FaqSection,
  FinalCta,
  HeroSplit,
  StickyCtaBar,
  TaskCardGrid,
  TwoPaths,
  faqEntriesFromDto,
} from '@/components/sections'
import type { ActionLinkComponent, SectionTone } from '@/components/ui'
import { MAIN_CONTENT_ID } from '@/components/layout/skip-link'
import { whatsappHrefFor } from '@/lib/whatsapp'
import { BlogSection, SelectedWorkSection } from './card-sections'
import type { HomeLabels } from './home-labels'
import {
  HOME_HREFS,
  HOME_LIST_LIMIT,
  heroSecondaryHref,
  planHomeSections,
  type HomeModel,
  type HomeSectionId,
} from './home-model'
import { MeetSinoSection } from './meet-sino-section'
import { poseImage } from './poses'

export type HomeViewProps = {
  model: HomeModel
  labels: HomeLabels
  /**
   * The realtime Sino canvas. When given, the hero switches to the `sino-canvas` variant and
   * renders it in the reserved slot above the poster; without it the poster alone is shown.
   */
  heroCanvas?: ReactNode
  /** Localised link component for internal links (next-intl's Link through the layout's AppLink). */
  linkComponent?: ActionLinkComponent
  /**
   * Target of the sticky bar's main action. The bar is a client component and cannot take the link
   * component, so the page passes an href it already localised.
   */
  stickyPrimaryHref?: string
}

// Anchors the sticky CTA bar observes. HeroSplit and FinalCta default to the same ids.
const HERO_CTA_ID = 'hero-cta'
const FINAL_CTA_ID = 'final-cta'

/**
 * The Home page body (page-patterns.md 2.1), composed from the shared section blocks. A pure
 * function of the model: the page loads the content, this renders it.
 *
 * Which sections exist and which tone each gets is decided once, by `planHomeSections`, after
 * hidden sections are removed. The view only renders that plan, so the order and the tone rules
 * cannot drift from what the tests check. Every section sits in a wrapper that records its id and
 * planned tone, which is also what the tests read.
 */
export function HomeView({
  model,
  labels,
  heroCanvas,
  linkComponent,
  stickyPrimaryHref = HOME_HREFS.contact,
}: HomeViewProps) {
  const { page, settings, productStatus, locale } = model
  const waitlistHref = heroSecondaryHref(productStatus)
  const whatsappHref = whatsappHrefFor(settings?.whatsapp, { kind: 'general' })

  const heroSecondary = page.hero.secondaryCtaLabel
    ? { label: page.hero.secondaryCtaLabel, href: waitlistHref }
    : null
  const finalSecondary = page.finalCta.secondaryCtaLabel
    ? { label: page.finalCta.secondaryCtaLabel, href: waitlistHref }
    : null
  const whatsappCta = whatsappHref
    ? { label: page.finalCta.whatsappCtaLabel, href: whatsappHref }
    : null

  const render: Record<HomeSectionId, (tone: SectionTone) => ReactNode> = {
    hero: () => (
      <HeroSplit
        variant={heroCanvas ? 'sino-canvas' : 'sino-still'}
        eyebrow={page.hero.eyebrow}
        headline={page.hero.headline}
        lead={page.hero.lead}
        primaryCta={{ label: page.hero.primaryCtaLabel, href: HOME_HREFS.contact }}
        secondaryCta={heroSecondary}
        ctaId={HERO_CTA_ID}
        image={page.hero.poster}
        // The poster is the LCP element: preload it and fetch it with high priority.
        priority
        canvas={heroCanvas}
        linkComponent={linkComponent}
      />
    ),
    twoPaths: () => (
      <TwoPaths
        locale={locale}
        linkComponent={linkComponent}
        product={{
          ...page.twoPaths.product,
          // The badge is a status, so it goes away with the status: no code edit at launch.
          badge: productStatus === 'live' ? undefined : labels.comingSoon,
          cta: { label: page.twoPaths.product.ctaLabel, href: HOME_HREFS.product },
          image: poseImage(page.twoPaths.product.pose),
          loop: 'L-phone',
        }}
        services={{
          ...page.twoPaths.services,
          cta: { label: page.twoPaths.services.ctaLabel, href: HOME_HREFS.services },
          image: poseImage(page.twoPaths.services.pose),
          loop: 'L-build',
        }}
      />
    ),
    meetSino: (tone) => (
      <MeetSinoSection title={page.meetSino.title} body={page.meetSino.body} tone={tone} />
    ),
    capabilities: (tone) => (
      <TaskCardGrid
        title={page.capabilities.title}
        intro={page.capabilities.intro}
        // No pose image: the phone mockup is built from the capability's own chat lines.
        items={model.capabilities}
        tone={tone}
      />
    ),
    howWeWork: (tone) => (
      <JourneySteps title={page.howWeWork.title} steps={page.howWeWork.steps} tone={tone} />
    ),
    whoWeHelp: (tone) => (
      <AudienceCards title={page.whoWeHelp.title} items={page.whoWeHelp.cards} tone={tone} />
    ),
    selectedWork: (tone) => (
      <SelectedWorkSection
        title={page.selectedWork.title}
        intro={page.selectedWork.intro}
        items={model.work.slice(0, HOME_LIST_LIMIT)}
        tone={tone}
        internalDemoLabel={labels.internalDemo}
        linkComponent={linkComponent}
      />
    ),
    fromBlog: (tone) => (
      <BlogSection
        title={page.fromBlog.title}
        posts={model.posts.slice(0, HOME_LIST_LIMIT)}
        locale={locale}
        tone={tone}
        linkComponent={linkComponent}
      />
    ),
    faq: (tone) => (
      <FaqSection
        title={page.faq.title}
        intro={page.faq.intro}
        items={faqEntriesFromDto(model.faq)}
        tone={tone}
        jsonLd
        linkComponent={linkComponent}
      />
    ),
    finalCta: () => (
      <FinalCta
        id={FINAL_CTA_ID}
        headline={page.finalCta.headline}
        body={page.finalCta.body}
        primaryCta={{ label: page.finalCta.primaryCtaLabel, href: HOME_HREFS.contact }}
        secondaryCta={finalSecondary}
        // No WhatsApp button here (owner decision, 2026-10-16): the panel keeps two clear
        // choices. WhatsApp stays in the header, the floating button and the sticky bar.
        image={poseImage('wave')}
        loop="L-wave"
        linkComponent={linkComponent}
      />
    ),
  }

  return (
    <>
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="outline-none">
        {planHomeSections(model).map(({ id, tone }) => (
          <div key={id} data-home-section={id} data-home-tone={tone}>
            {render[id](tone)}
          </div>
        ))}
      </main>
      <StickyCtaBar
        // The setting decides; with no settings the bar stays off rather than guessing.
        enabled={settings?.features.enableStickyCtaBar === true}
        label={labels.stickyBarLabel ?? page.hero.primaryCtaLabel}
        primaryCta={{ label: page.hero.primaryCtaLabel, href: stickyPrimaryHref }}
        whatsappCta={whatsappCta}
        heroTargetId={HERO_CTA_ID}
        endTargetId={FINAL_CTA_ID}
      />
    </>
  )
}
