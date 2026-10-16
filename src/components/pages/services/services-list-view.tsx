import type { ReactNode } from 'react'
import {
  AudienceCards,
  FaqSection,
  FinalCta,
  HeroSplit,
  SinoStage,
  StickySteps,
  faqEntriesFromDto,
} from '@/components/sections'
import type { ActionLinkComponent, SectionTone } from '@/components/ui'
import { MAIN_CONTENT_ID } from '@/components/layout/skip-link'
import { whatsappHrefFor } from '@/lib/whatsapp'
import { SelectedWorkSection } from '../home/card-sections'
import { PoseImage } from '../home/pose-image'
import { HOW_WE_WORK_POSES, poseImage } from '../home/poses'
import { ServiceCardsSection } from './service-cards-section'
import type { ServicesLabels } from './services-labels'
import {
  planServicesListSections,
  SERVICES_HREFS,
  SERVICES_LIST_WORK_LIMIT,
  type ServicesListModel,
  type ServicesListSectionId,
} from './services-model'

export type ServicesListViewProps = {
  model: ServicesListModel
  labels: ServicesLabels
  /** Localised link component for internal links (next-intl's Link through the layout's AppLink). */
  linkComponent?: ActionLinkComponent
}

/**
 * The Services overview body (page-patterns.md 2.3), composed from the shared section blocks. A
 * pure function of the model: the page loads the content, this renders it.
 *
 * Which sections exist and which tone each gets is decided once, by `planServicesListSections`,
 * after hidden sections are removed. Every section sits in a wrapper that records its id and
 * planned tone, which is also what the tests read.
 */
export function ServicesListView({ model, labels, linkComponent }: ServicesListViewProps) {
  const { page, settings } = model
  const whatsappHref = whatsappHrefFor(settings?.whatsapp, { kind: 'general' })
  const whatsappCta = whatsappHref ? { label: labels.chatOnWhatsapp, href: whatsappHref } : null

  const render: Record<ServicesListSectionId, (tone: SectionTone) => ReactNode> = {
    hero: () => (
      <HeroSplit
        variant="sino-still"
        eyebrow={page.hero.eyebrow}
        headline={page.hero.headline}
        lead={page.hero.lead}
        primaryCta={{ label: page.hero.primaryCtaLabel, href: SERVICES_HREFS.contact }}
        // S7 (magnifier), the AI Discovery pose: the first thing a visitor who is unsure sees.
        image={poseImage('magnifier')}
        priority
        linkComponent={linkComponent}
      />
    ),
    services: (tone) => (
      <ServiceCardsSection
        title={page.servicesIntro.title}
        intro={page.servicesIntro.body}
        services={model.services}
        ctaLabel={labels.cardCta}
        tone={tone}
        linkComponent={linkComponent}
      />
    ),
    howWeWork: (tone) => (
      <StickySteps
        title={page.howWeWork.title}
        tone={tone}
        steps={page.howWeWork.steps.map((step, index) => ({
          ...step,
          screen: (
            // The stage glow spills past its box; the clip keeps it from widening the page.
            <div className="overflow-x-clip">
              <SinoStage className="max-w-xs sm:max-w-sm">
                <PoseImage
                  pose={HOW_WE_WORK_POSES[index % HOW_WE_WORK_POSES.length]!}
                  sizes="(min-width: 1024px) 384px, 80vw"
                  className="size-full object-contain"
                />
              </SinoStage>
            </div>
          ),
        }))}
      />
    ),
    whoWeHelp: (tone) => (
      <AudienceCards title={page.whoWeHelp.title} items={page.whoWeHelp.cards} tone={tone} />
    ),
    selectedWork: (tone) => (
      <SelectedWorkSection
        title={page.selectedWork.title}
        intro={page.selectedWork.intro}
        items={model.work.slice(0, SERVICES_LIST_WORK_LIMIT)}
        tone={tone}
        internalDemoLabel={labels.internalDemo}
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
        headline={page.finalCta.headline}
        body={page.finalCta.body}
        primaryCta={{ label: page.finalCta.primaryCtaLabel, href: SERVICES_HREFS.contact }}
        // The overview has no second action: the content's optional one points nowhere here.
        whatsappCta={whatsappCta}
        image={poseImage('wave')}
        linkComponent={linkComponent}
      />
    ),
  }

  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1} className="outline-none">
      {planServicesListSections(model).map(({ id, tone }) => (
        <div key={id} data-services-section={id} data-services-tone={tone}>
          {render[id](tone)}
        </div>
      ))}
    </main>
  )
}
