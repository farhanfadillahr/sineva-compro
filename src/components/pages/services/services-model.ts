import { FINAL_CTA_TONE } from '@/components/sections/final-cta'
import type { PublicContentSource } from '@/features/content/public'
import type {
  ContentLocale,
  FaqItem,
  ServiceDetail,
  ServiceSummary,
  ServicesOverviewPageContent,
  SiteSettingsDTO,
  WorkSummary,
} from '@/features/content/types'
import { planTones, type PlannedSection } from './plan-tones'

/** The overview shows up to three work items (page-patterns.md 2.3 row 5). */
export const SERVICES_LIST_WORK_LIMIT = 3

export const SERVICES_HREFS = {
  home: '/',
  contact: '/contact',
  services: '/services',
} as const

export const serviceDetailHref = (slug: string) => `${SERVICES_HREFS.services}/${slug}`

/**
 * Target of every "Plan my AI project" CTA. The slug is encoded: it comes from content, and an
 * editor-made slug with `&` or `=` must not add or rewrite query parameters of the contact form.
 */
export const serviceContactHref = (slug: string, contactPath: string = SERVICES_HREFS.contact) =>
  `${contactPath}?service=${encodeURIComponent(slug)}`

// ---------------------------------------------------------------------------------------------
// List /services
// ---------------------------------------------------------------------------------------------

export type ServicesListModel = Readonly<{
  locale: ContentLocale
  page: ServicesOverviewPageContent
  /** `null` when settings do not exist for the locale: features read as off, no WhatsApp. */
  settings: SiteSettingsDTO | null
  services: readonly ServiceSummary[]
  faq: readonly FaqItem[]
  /** At most three. Empty when the section is switched off anywhere. */
  work: readonly WorkSummary[]
}>

/** The work section needs both the page toggle and the site setting (the plan checks it again). */
const workAllowed = (pageVisible: boolean, settings: SiteSettingsDTO | null): boolean =>
  pageVisible && settings?.features.showSelectedWork === true

/**
 * Everything the Services overview renders, through the public content contract only. Resolves
 * to `null` when the page has no content for the locale (the page then answers 404).
 *
 * Work is not even queried when its toggle is off.
 */
export async function loadServicesListModel(
  source: PublicContentSource,
  locale: ContentLocale,
): Promise<ServicesListModel | null> {
  const [page, settings] = await Promise.all([
    source.getPage('servicesOverview', locale),
    source.getSiteSettings(locale),
  ])
  if (!page) return null

  const [services, faq, work] = await Promise.all([
    source.listServices(locale),
    source.listFaq('services', locale),
    workAllowed(page.selectedWork.visible, settings)
      ? source.listWork({ locale })
      : Promise.resolve([]),
  ])
  return {
    locale,
    page,
    settings,
    services: services.filter((service) => service.locale === locale),
    faq,
    work: work.filter((item) => item.locale === locale).slice(0, SERVICES_LIST_WORK_LIMIT),
  }
}

export type ServicesListSectionId =
  'hero' | 'services' | 'howWeWork' | 'whoWeHelp' | 'selectedWork' | 'faq' | 'finalCta'

/** Tones of page-patterns.md 2.3: hero A, services C, how we work ALT, then canvas, final CTA I. */
export function planServicesListSections(
  model: ServicesListModel,
): readonly PlannedSection<ServicesListSectionId>[] {
  const { page } = model
  return planTones<ServicesListSectionId>([
    { id: 'hero', visible: true, preferred: 'aurora', fixed: true },
    { id: 'services', visible: model.services.length > 0, preferred: 'canvas' },
    { id: 'howWeWork', visible: page.howWeWork.steps.length > 0, preferred: 'alt' },
    { id: 'whoWeHelp', visible: page.whoWeHelp.cards.length > 0, preferred: 'canvas' },
    {
      id: 'selectedWork',
      // Checked again here: the plan is the one place that decides what renders.
      visible: workAllowed(page.selectedWork.visible, model.settings) && model.work.length > 0,
      preferred: 'canvas',
    },
    { id: 'faq', visible: model.faq.length > 0, preferred: 'canvas' },
    { id: 'finalCta', visible: true, preferred: FINAL_CTA_TONE, fixed: true },
  ])
}

// ---------------------------------------------------------------------------------------------
// Detail /services/[slug]
// ---------------------------------------------------------------------------------------------

export type ServiceDetailModel = Readonly<{
  locale: ContentLocale
  service: ServiceDetail
  settings: SiteSettingsDTO | null
  /** FAQ items tagged `service:<slug>`. */
  faq: readonly FaqItem[]
  /** Work of this service only. */
  work: readonly WorkSummary[]
}>

/** `null` for an unknown slug: the page answers 404. */
export async function loadServiceDetailModel(
  source: PublicContentSource,
  slug: string,
  locale: ContentLocale,
): Promise<ServiceDetailModel | null> {
  const service = await source.getService(slug, locale)
  if (!service || service.locale !== locale) return null

  const [settings, faq, work] = await Promise.all([
    source.getSiteSettings(locale),
    source.listFaq(`service:${service.slug}`, locale),
    source.listWork({ locale, service: service.slug }),
  ])
  return {
    locale,
    service,
    settings,
    faq,
    // The source already filters; the rule is part of the page contract, so a work item of
    // another service or locale never reaches a visitor.
    work: work.filter((item) => item.locale === locale && item.serviceSlug === service.slug),
  }
}

export type ServiceDetailSectionId =
  'hero' | 'problems' | 'deliverables' | 'process' | 'tools' | 'relatedWork' | 'faq' | 'finalCta'

/** Tones of page-patterns.md 2.4. */
export function planServiceDetailSections(
  model: ServiceDetailModel,
): readonly PlannedSection<ServiceDetailSectionId>[] {
  const { service } = model
  return planTones<ServiceDetailSectionId>([
    { id: 'hero', visible: true, preferred: 'aurora', fixed: true },
    { id: 'problems', visible: service.problems.length > 0, preferred: 'canvas' },
    { id: 'deliverables', visible: service.deliverables.length > 0, preferred: 'tint' },
    { id: 'process', visible: service.process.length > 0, preferred: 'alt' },
    { id: 'tools', visible: service.tools.length > 0, preferred: 'canvas' },
    {
      id: 'relatedWork',
      visible: model.settings?.features.showSelectedWork === true && model.work.length > 0,
      preferred: 'alt',
    },
    { id: 'faq', visible: model.faq.length > 0, preferred: 'canvas' },
    { id: 'finalCta', visible: true, preferred: FINAL_CTA_TONE, fixed: true },
  ])
}
