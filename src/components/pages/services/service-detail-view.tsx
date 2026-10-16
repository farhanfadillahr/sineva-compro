import type { ReactNode } from 'react'
import {
  FaqSection,
  FinalCta,
  HeroSplit,
  StickyCtaBar,
  faqEntriesFromDto,
} from '@/components/sections'
import { serializeJsonLd } from '@/components/sections/_internal/faq'
import type { ActionLinkComponent, SectionTone } from '@/components/ui'
import { MAIN_CONTENT_ID } from '@/components/layout/skip-link'
import { whatsappHrefFor } from '@/lib/whatsapp'
import { SelectedWorkSection } from '../home/card-sections'
import { poseImage } from '../home/poses'
import {
  DeliverablesSection,
  ProblemsSection,
  ProcessSection,
  ToolsSection,
} from './detail-sections'
import type { ServicesLabels } from './services-labels'
import { buildBreadcrumbJsonLd, buildServiceJsonLd } from './services-json-ld'
import {
  planServiceDetailSections,
  SERVICES_HREFS,
  serviceContactHref,
  serviceDetailHref,
  type ServiceDetailModel,
  type ServiceDetailSectionId,
} from './services-model'

export type ServiceDetailViewProps = {
  model: ServiceDetailModel
  labels: ServicesLabels
  /** Localised link component for internal links (next-intl's Link through the layout's AppLink). */
  linkComponent?: ActionLinkComponent
  /**
   * Target of the sticky bar's main action. The bar is a client component and cannot take the link
   * component, so the page passes an href it already localised. Defaults to the contact CTA.
   */
  stickyPrimaryHref?: string
  /** Public site origin for the JSON-LD urls; without one they stay root-relative. */
  origin?: string | null
}

// Anchors the sticky CTA bar observes. HeroSplit and FinalCta default to the same ids.
const HERO_CTA_ID = 'hero-cta'
const FINAL_CTA_ID = 'final-cta'

/**
 * The Service detail body (page-patterns.md 2.4), composed from the shared section blocks. Like
 * the Home page it renders a plan (`planServiceDetailSections`), so what is hidden and which
 * tone each band gets is decided in one place.
 *
 * Structured data: Service and BreadcrumbList are emitted here; the FAQ block adds FAQPage for
 * the questions it shows.
 */
export function ServiceDetailView({
  model,
  labels,
  linkComponent,
  stickyPrimaryHref,
  origin = null,
}: ServiceDetailViewProps) {
  const { service, settings } = model
  const contactHref = serviceContactHref(service.slug)
  const whatsappHref = whatsappHrefFor(settings?.whatsapp, {
    kind: 'service',
    slug: service.slug,
    name: service.title,
  })
  const whatsappCta = whatsappHref ? { label: labels.chatOnWhatsapp, href: whatsappHref } : null

  const render: Record<ServiceDetailSectionId, (tone: SectionTone) => ReactNode> = {
    hero: () => (
      <HeroSplit
        variant="sino-still"
        eyebrow={null}
        headline={service.title}
        lead={service.summary}
        primaryCta={{ label: service.ctaLabel, href: contactHref }}
        ctaId={HERO_CTA_ID}
        image={poseImage(service.pose)}
        priority
        linkComponent={linkComponent}
      />
    ),
    problems: (tone) => (
      <ProblemsSection title={labels.detail.problemsTitle} items={service.problems} tone={tone} />
    ),
    deliverables: (tone) => (
      <DeliverablesSection
        title={labels.detail.deliverablesTitle}
        items={service.deliverables}
        tone={tone}
      />
    ),
    process: (tone) => (
      <ProcessSection title={labels.detail.processTitle} steps={service.process} tone={tone} />
    ),
    tools: (tone) => (
      <ToolsSection title={labels.detail.toolsTitle} tools={service.tools} tone={tone} />
    ),
    relatedWork: (tone) => (
      <SelectedWorkSection
        title={labels.detail.relatedWorkTitle}
        intro={null}
        items={model.work}
        tone={tone}
        internalDemoLabel={labels.internalDemo}
        linkComponent={linkComponent}
      />
    ),
    faq: (tone) => (
      <FaqSection
        title={labels.detail.faqTitle}
        items={faqEntriesFromDto(model.faq)}
        tone={tone}
        jsonLd
        linkComponent={linkComponent}
      />
    ),
    finalCta: () => (
      <FinalCta
        id={FINAL_CTA_ID}
        headline={labels.detail.finalCtaHeadline}
        body={labels.detail.finalCtaBody}
        primaryCta={{ label: service.ctaLabel, href: contactHref }}
        whatsappCta={whatsappCta}
        image={poseImage('wave')}
        linkComponent={linkComponent}
      />
    ),
  }

  const structuredData = [
    buildServiceJsonLd({
      service,
      providerName: settings?.brand.siteName ?? null,
      origin,
    }),
    buildBreadcrumbJsonLd(
      [
        { name: labels.homeCrumb, path: SERVICES_HREFS.home },
        { name: labels.servicesCrumb, path: SERVICES_HREFS.services },
        { name: service.title, path: serviceDetailHref(service.slug) },
      ],
      origin,
    ),
  ]

  return (
    <>
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="outline-none">
        {planServiceDetailSections(model).map(({ id, tone }) => (
          <div key={id} data-services-section={id} data-services-tone={tone}>
            {render[id](tone)}
          </div>
        ))}
        {structuredData.map((data) => (
          <script
            key={data['@type']}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
          />
        ))}
      </main>
      <StickyCtaBar
        // The setting decides; with no settings the bar stays off rather than guessing.
        enabled={settings?.features.enableStickyCtaBar === true}
        label={labels.stickyBarLabel}
        primaryCta={{ label: service.ctaLabel, href: stickyPrimaryHref ?? contactHref }}
        whatsappCta={whatsappCta}
        heroTargetId={HERO_CTA_ID}
        endTargetId={FINAL_CTA_ID}
      />
    </>
  )
}
