import type { SectionTone } from '@/components/ui'
import { FINAL_CTA_TONE } from '@/components/sections/final-cta'
import type { PublicContentSource } from '@/features/content/public'
import type {
  ContentLocale,
  FaqItem,
  HomePageContent,
  PostSummary,
  ProductCapability,
  ProductLaunchStatus,
  SiteSettingsDTO,
  WorkSummary,
} from '@/features/content/types'

/** Home shows up to three featured work items and the three latest posts (FR-HOME-04, 07). */
export const HOME_LIST_LIMIT = 3

const PRODUCT_PATH = '/products/ai-agents'
/** Anchor of the waitlist form on the Product page. */
const WAITLIST_ANCHOR = '#waitlist'

/**
 * Target of the secondary CTA. While the product is coming soon it is the waitlist form; once the
 * status is `live` it is the product page itself. The label comes from the content, so going live
 * is a data change in both places and never a code edit.
 */
export function heroSecondaryHref(status: ProductLaunchStatus): string {
  return status === 'live' ? PRODUCT_PATH : `${PRODUCT_PATH}${WAITLIST_ANCHOR}`
}

export const HOME_HREFS = {
  contact: '/contact',
  product: PRODUCT_PATH,
  services: '/services',
} as const

export type HomeModel = Readonly<{
  locale: ContentLocale
  page: HomePageContent
  /** `null` when settings do not exist for the locale: features read as off, no WhatsApp. */
  settings: SiteSettingsDTO | null
  productStatus: ProductLaunchStatus
  capabilities: readonly ProductCapability[]
  faq: readonly FaqItem[]
  /** Featured work only, at most three. Empty when the section is switched off anywhere. */
  work: readonly WorkSummary[]
  /** Latest posts of the page locale, at most three. Empty when the section is switched off. */
  posts: readonly PostSummary[]
}>

/**
 * Everything the Home page renders, through the public content contract only. Resolves to `null`
 * when the page has no content for the locale (the page then answers 404).
 *
 * Lists behind a toggle are not even queried when the toggle is off: "Selected work" honours the
 * page content toggle and the site setting, the blog the page content toggle.
 */
export async function loadHomeModel(
  source: PublicContentSource,
  locale: ContentLocale,
): Promise<HomeModel | null> {
  const [page, settings, productPage] = await Promise.all([
    source.getPage('home', locale),
    source.getSiteSettings(locale),
    source.getPage('product', locale),
  ])
  if (!page) return null

  const showWork = page.selectedWork.visible && settings?.features.showSelectedWork === true
  const showPosts = page.fromBlog.visible

  const [capabilities, faq, work, postPage] = await Promise.all([
    source.listCapabilities(locale),
    source.listFaq('home', locale),
    showWork ? source.listWork({ locale, featured: true }) : Promise.resolve([]),
    showPosts
      ? source.listPosts({ locale, page: 1, pageSize: HOME_LIST_LIMIT })
      : Promise.resolve(null),
  ])

  return {
    locale,
    page,
    settings,
    productStatus: productPage?.productStatus ?? 'coming_soon',
    capabilities,
    faq,
    // The source already filters, but the rule is part of the page contract: a non-featured or
    // foreign-locale row must never reach a visitor.
    work: work.filter((item) => item.featured && item.locale === locale).slice(0, HOME_LIST_LIMIT),
    posts: (postPage?.posts ?? [])
      .filter((post) => post.locale === locale)
      .slice(0, HOME_LIST_LIMIT),
  }
}

export type HomeSectionId =
  | 'hero'
  | 'twoPaths'
  | 'meetSino'
  | 'capabilities'
  | 'howWeWork'
  | 'whoWeHelp'
  | 'selectedWork'
  | 'fromBlog'
  | 'faq'
  | 'finalCta'

export type PlannedSection = Readonly<{ id: HomeSectionId; tone: SectionTone }>

// Tones of page-patterns.md 2.1. The final CTA contributes the tone of its inverse panel.
const PREFERRED_TONE: Record<HomeSectionId, SectionTone> = {
  hero: 'aurora',
  twoPaths: 'canvas',
  meetSino: 'tint',
  capabilities: 'canvas',
  howWeWork: 'alt',
  whoWeHelp: 'canvas',
  selectedWork: 'canvas',
  fromBlog: 'alt',
  faq: 'canvas',
  finalCta: FINAL_CTA_TONE,
}

// These blocks own their tone (the hero is always aurora, TwoPaths always canvas, the final CTA a
// canvas band around an inverse panel); the rest take a `tone` prop and may be switched.
const TONE_IS_FIXED = new Set<HomeSectionId>(['hero', 'twoPaths', 'finalCta'])

/**
 * The sections that will actually render, in order, each with the tone it must be given.
 *
 * Hiding a section changes which sections touch. Tones are therefore assigned after the visible
 * list is known: a section that would repeat the non-white tone of its visible predecessor falls
 * back to canvas (white), which can never clash. Doing it the other way round (fixed tones, then
 * dropping sections) is what leaves two `alt` bands side by side.
 */
export function planHomeSections(model: HomeModel): readonly PlannedSection[] {
  const { page } = model
  const visible: Record<HomeSectionId, boolean> = {
    hero: true,
    twoPaths: true,
    meetSino: true,
    capabilities: model.capabilities.length > 0,
    howWeWork: page.howWeWork.steps.length > 0,
    whoWeHelp: page.whoWeHelp.cards.length > 0,
    // The toggles are checked again here, not only before the queries: the plan is the single
    // place that decides what renders, whatever the model was built from.
    selectedWork:
      page.selectedWork.visible &&
      model.settings?.features.showSelectedWork === true &&
      model.work.length > 0,
    fromBlog: page.fromBlog.visible && model.posts.length > 0,
    faq: model.faq.length > 0,
    finalCta: true,
  }
  const plan: PlannedSection[] = []
  for (const id of Object.keys(PREFERRED_TONE) as HomeSectionId[]) {
    if (!visible[id]) continue
    let tone = PREFERRED_TONE[id]
    const previous = plan.at(-1)
    if (!TONE_IS_FIXED.has(id) && tone !== 'canvas' && previous?.tone === tone) tone = 'canvas'
    plan.push({ id, tone })
  }
  return plan
}
