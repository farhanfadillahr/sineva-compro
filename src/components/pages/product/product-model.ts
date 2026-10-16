import type { SectionTone } from '@/components/ui'
import { FINAL_CTA_TONE } from '@/components/sections/final-cta'
import type { PublicContentSource } from '@/features/content/public'
import type {
  ContentLocale,
  FaqItem,
  Industry,
  ProductCapability,
  ProductLaunchStatus,
  ProductPageContent,
  SiteSettingsDTO,
} from '@/features/content/types'
import { normalizeWhatsAppNumber, whatsappHrefFor } from '@/lib/whatsapp'
import type { WaitlistChannels } from './waitlist-message'

const PRODUCT_PATH = '/products/ai-agents'
/** Id of the hero waitlist block, which the Home CTA and the final CTA link to. */
export const WAITLIST_ANCHOR_ID = 'waitlist'

export const PRODUCT_HREFS = {
  contact: '/contact',
  product: PRODUCT_PATH,
  waitlist: `${PRODUCT_PATH}#${WAITLIST_ANCHOR_ID}`,
  privacy: '/privacy-policy',
} as const

export type ProductModel = Readonly<{
  locale: ContentLocale
  page: ProductPageContent
  /** `null` when settings do not exist for the locale: features read as off, no WhatsApp. */
  settings: SiteSettingsDTO | null
  productStatus: ProductLaunchStatus
  capabilities: readonly ProductCapability[]
  /** Business types of the "Made for your business" tabs, and the waitlist form options. */
  industries: readonly Industry[]
  faq: readonly FaqItem[]
}>

/**
 * Everything the Product page renders, through the public content contract only. Resolves to
 * `null` when the page has no content for the locale (the page then answers 404).
 */
export async function loadProductModel(
  source: PublicContentSource,
  locale: ContentLocale,
): Promise<ProductModel | null> {
  const [page, settings, capabilities, industries, faq] = await Promise.all([
    source.getPage('product', locale),
    source.getSiteSettings(locale),
    source.listCapabilities(locale),
    source.listIndustries(locale),
    source.listFaq('product', locale),
  ])
  if (!page) return null
  return {
    locale,
    page,
    settings,
    productStatus: page.productStatus,
    capabilities,
    industries,
    faq,
  }
}

/**
 * Where the main "get this product" action goes. While the product is coming soon that is the
 * waitlist form; once it is `live` there is no form, and the action opens the product chat on
 * WhatsApp (the contact page when no number is usable). The label comes from the content, so
 * going live is a data change and never a code edit.
 *
 * Gotcha: the content has no field for a product URL yet. When the product has its own entry
 * point, that field belongs in the DTO and this is the one place that reads it.
 */
export function productActionHref(
  status: ProductLaunchStatus,
  settings: SiteSettingsDTO | null,
): string {
  if (status !== 'live') return PRODUCT_HREFS.waitlist
  return whatsappHrefFor(settings?.whatsapp, { kind: 'product' }) ?? PRODUCT_HREFS.contact
}

/**
 * The ways a waitlist request can leave the browser, or `null` when there is none (no settings,
 * no usable number and no email): the page then shows no form rather than one that cannot send.
 */
export function waitlistChannelsFor(settings: SiteSettingsDTO | null): WaitlistChannels | null {
  if (!settings) return null
  const whatsappNumber = normalizeWhatsAppNumber(settings.whatsapp.number)
  const email = settings.contact.email?.trim() || null
  if (!whatsappNumber && !email) return null
  return {
    // The form builds the wa.me link itself, from the number as stored.
    whatsappNumber: whatsappNumber ? settings.whatsapp.number : null,
    email,
    greeting: settings.whatsapp.templates.product,
  }
}

export type ProductSectionId =
  'hero' | 'capabilities' | 'howItWorks' | 'madeForYou' | 'control' | 'faq' | 'finalCta'

export type PlannedSection = Readonly<{ id: ProductSectionId; tone: SectionTone }>

// Tones of page-patterns.md 2.2. The final CTA contributes the tone of its inverse panel. The
// optional comparison (row 6, canvas) is left out of phase 1: there is no verified comparison
// data, so the page never plans it, whatever its `visible` flag says.
const PLAN: readonly PlannedSection[] = [
  { id: 'hero', tone: 'aurora' },
  { id: 'capabilities', tone: 'canvas' },
  { id: 'howItWorks', tone: 'alt' },
  { id: 'madeForYou', tone: 'canvas' },
  { id: 'control', tone: 'tint' },
  { id: 'faq', tone: 'canvas' },
  { id: 'finalCta', tone: FINAL_CTA_TONE },
]

/**
 * The sections that will actually render, in order, each with the tone it must be given. The
 * single place that decides what renders; the view only follows it.
 *
 * Hiding a section cannot put two non-white bands side by side: every non-white tone (aurora, alt,
 * tint, inverse) appears once, so only canvas repeats, and two canvas bands read as one.
 */
export function planProductSections(model: ProductModel): readonly PlannedSection[] {
  const { page } = model
  const visible: Record<ProductSectionId, boolean> = {
    hero: true,
    capabilities: model.capabilities.length > 0,
    howItWorks: page.howItWorks.steps.length > 0,
    madeForYou: model.industries.length > 0,
    control: page.control.features.length > 0,
    faq: model.faq.length > 0,
    finalCta: true,
  }
  return PLAN.filter((section) => visible[section.id])
}
