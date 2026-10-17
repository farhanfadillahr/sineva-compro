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
  faqEntriesFromDto,
} from '@/components/sections'
import { Badge, Card, type ActionLinkComponent, type SectionTone } from '@/components/ui'
import { MAIN_CONTENT_ID } from '@/components/layout/skip-link'
import { poseImage } from '@/components/pages/home/poses'
import { MadeForYouSection } from './made-for-you-section'
import type { ProductLabels } from './product-labels'
import {
  PRODUCT_HREFS,
  WAITLIST_ANCHOR_ID,
  planProductSections,
  productActionHref,
  waitlistChannelsFor,
  type ProductModel,
  type ProductSectionId,
} from './product-model'
import { WaitlistForm, type WaitlistFormProps } from './waitlist-form'

export type ProductViewProps = {
  model: ProductModel
  /** The `joinWaitlist` server action for the waitlist form, passed by the server page. */
  joinWaitlist: WaitlistFormProps['join']
  labels: ProductLabels
  /** Localised link component for internal links (next-intl's Link through the layout's AppLink). */
  linkComponent?: ActionLinkComponent
  /**
   * Ready, localised href of the privacy page for the consent link. The waitlist form is a client
   * component and cannot take the link component, so the page passes a string.
   */
  privacyHref?: string
  /**
   * Target of the sticky bar's main action. The bar is a client component, so this is a plain
   * href. Defaults to the waitlist anchor while the form exists.
   */
  stickyPrimaryHref?: string
}

// Anchors the sticky CTA bar observes. HeroSplit and FinalCta default to the same ids.
const HERO_CTA_ID = 'hero-cta'
const FINAL_CTA_ID = 'final-cta'

const EXTERNAL_HREF = /^[a-z][a-z0-9+.-]*:/i

/**
 * Chat lines for the screen of step `index` out of `total`: the conversation of the hero mockup,
 * revealed step by step (a request, Sino's draft, the review, the follow-up). It reuses the
 * content's own lines, so the story shows nothing the content does not already say.
 */
function bubblesForStep<T>(bubbles: readonly T[], index: number, total: number): readonly T[] {
  if (bubbles.length === 0 || total === 0) return []
  return bubbles.slice(0, Math.max(1, Math.ceil(((index + 1) * bubbles.length) / total)))
}

/**
 * The Product page body (page-patterns.md 2.2), composed from the shared section blocks. A pure
 * function of the model: the page loads the content, this renders it.
 *
 * Which sections exist and which tone each gets is decided once, by `planProductSections`; the
 * view only renders that plan, so order and tones cannot drift from what the tests check. Every
 * section sits in a wrapper that records its id and planned tone.
 *
 * Phase 1 is static. The waitlist is the inline "Get notified" form, which hands a prefilled
 * message to the visitor's own WhatsApp; nothing is stored. When the content status is `live` the
 * form and the Coming soon label are replaced by the main action, with no code change.
 */
export function ProductView({
  model,
  labels,
  linkComponent,
  privacyHref = PRODUCT_HREFS.privacy,
  stickyPrimaryHref,
  joinWaitlist,
}: ProductViewProps) {
  const { page, settings, productStatus, industries } = model
  const comingSoon = productStatus !== 'live'
  const channels = comingSoon ? waitlistChannelsFor(settings) : null

  // Where the main action goes: the form while there is one, the product action once live, and
  // the contact page when the waitlist has nowhere to send (no settings, no number, no email).
  const mainHref = comingSoon
    ? channels
      ? PRODUCT_HREFS.waitlist
      : PRODUCT_HREFS.contact
    : productActionHref(productStatus, settings)
  // An absolute URL (wa.me) must not go through the localising link component.
  const mainLinkComponent = EXTERNAL_HREF.test(mainHref) ? undefined : linkComponent

  const consultationLabel = page.finalCta.secondaryCtaLabel
  const consultation = consultationLabel
    ? { label: consultationLabel, href: PRODUCT_HREFS.contact }
    : null

  const waitlistBlock = comingSoon ? (
    <Card
      id={channels ? WAITLIST_ANCHOR_ID : undefined}
      className="flex w-full max-w-lg scroll-mt-24 flex-col gap-4"
    >
      <Badge soon className="self-start">
        {labels.comingSoon}
      </Badge>
      <p className="text-body-sm text-pretty text-text-secondary">{page.hero.waitlistIntro}</p>
      {channels ? (
        <WaitlistForm
          labels={labels.waitlist}
          submitLabel={page.hero.primaryCtaLabel}
          businessTypes={industries}
          channels={channels}
          privacyHref={privacyHref}
          join={joinWaitlist}
          locale={model.locale}
        />
      ) : null}
    </Card>
  ) : null

  // While coming soon the inline waitlist form is the only hero action: a second primary button
  // above it split attention. The consultation stays in the final CTA.
  const heroCta = comingSoon ? null : { label: page.hero.primaryCtaLabel, href: mainHref }

  const render: Record<ProductSectionId, (tone: SectionTone) => ReactNode> = {
    hero: () => (
      <HeroSplit
        variant="mockup"
        eyebrow={page.hero.eyebrow}
        headline={page.hero.headline}
        lead={page.hero.lead}
        primaryCta={heroCta}
        ctaId={HERO_CTA_ID}
        extra={waitlistBlock}
        mockup={{ ...page.hero.mockup, chrome: labels.phone }}
        linkComponent={comingSoon ? linkComponent : mainLinkComponent}
      />
    ),
    capabilities: (tone) => (
      <TaskCardGrid
        phoneChrome={labels.phone}
        title={page.capabilities.title}
        intro={page.capabilities.intro}
        // These task cards show their request and reply on the shared 3D phone mockup. Sino's
        // companion role is introduced elsewhere on the page.
        items={model.capabilities.map((capability) => ({
          ...capability,
          image: null,
        }))}
        tone={tone}
      />
    ),
    howItWorks: (tone) => (
      <StickySteps
        title={page.howItWorks.title}
        tone={tone}
        steps={page.howItWorks.steps.map((step, index, steps) => {
          const bubbles = bubblesForStep(page.hero.mockup.bubbles, index, steps.length)
          return {
            ...step,
            screen:
              bubbles.length > 0 ? (
                <PhoneFrame size="md" chrome={labels.phone}>
                  <ChatBubbles bubbles={bubbles} />
                </PhoneFrame>
              ) : undefined,
          }
        })}
      />
    ),
    madeForYou: (tone) => (
      <MadeForYouSection
        title={page.madeForYou.title}
        intro={page.madeForYou.intro}
        tabsLabel={labels.tabsLabel}
        items={industries}
        tone={tone}
      />
    ),
    control: (tone) => (
      <AudienceCards title={page.control.title} items={page.control.features} tone={tone} />
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
        primaryCta={{ label: page.finalCta.primaryCtaLabel, href: mainHref }}
        secondaryCta={consultation}
        image={poseImage('wave')}
        linkComponent={mainLinkComponent}
      />
    ),
  }

  return (
    <>
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="outline-none">
        {planProductSections(model).map(({ id, tone }) => (
          <div key={id} data-product-section={id} data-product-tone={tone}>
            {render[id](tone)}
          </div>
        ))}
      </main>
      <StickyCtaBar
        // The setting decides; with no settings the bar stays off rather than guessing.
        enabled={settings?.features.enableStickyCtaBar === true}
        label={labels.stickyBarLabel}
        primaryCta={{
          label: page.hero.primaryCtaLabel,
          href: stickyPrimaryHref ?? (channels ? `#${WAITLIST_ANCHOR_ID}` : mainHref),
        }}
        heroTargetId={HERO_CTA_ID}
        endTargetId={FINAL_CTA_ID}
      />
    </>
  )
}
