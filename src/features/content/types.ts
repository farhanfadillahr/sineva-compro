/**
 * DTOs for the public content contract shared by the landing pages and the CMS.
 *
 * Rules every DTO here follows (docs/superpowers/plans/2026-10-15-admin-cms.md section 1):
 * - published data only, in one explicit locale;
 * - safe projection: no internal ids, drafts, lead data, author emails or storage keys;
 * - "empty" is explicit: `[]` for collections, `null` for missing optional content, never
 *   placeholder text. Sections the editor can switch off carry `visible: boolean`.
 * A change to any DTO affects both sides: update the fixtures and tell the other owner.
 */
import type { routing } from '../../i18n/routing'

/** Locales the content layer can be asked for. Derived so a new routing locale flows through. */
export type ContentLocale = (typeof routing.locales)[number]

// ---------------------------------------------------------------------------------------------
// Visual choice keys. Select fields over a code-defined list (3d-asset-requirements.md), never
// free uploads. Descriptive keys, with the asset ID they map to.
// ---------------------------------------------------------------------------------------------

export const POSE_KEYS = [
  'wave', // S1  wave, footer CTA and waitlist
  'holding-phone', // S2  holding phone, customer chat
  'typing-laptop', // S3  typing on laptop, operations and AI Build
  'megaphone', // S4  megaphone or phone with heart bubble, social media
  'coins-clipboard', // S5  coin stack and clipboard, finance and admin
  'handover', // S6  handing over a paper, sales follow-up
  'magnifier', // S7  magnifying glass, AI Discovery
  'building-blocks', // S8  stacking building blocks, AI Build
  'whiteboard', // S9  pointing at a whiteboard, AI Enablement
  'thumbs-up', // S10 thumbs up, thank-you page
  'confused', // S11 scratching helmet, 404 and empty states
  'peeking', // S12 peeking from the right edge
  'relaxed-mug', // S13 sitting with a mug, About and blog empty state
  'headshot', // S14 front-facing bust, chat avatar and author fallback
] as const
export type PoseKey = (typeof POSE_KEYS)[number]

export const ICON_KEYS = [
  'chat-bubble', // I1
  'calendar', // I2
  'coin-wallet', // I3
  'megaphone', // I4
  'chart-rising', // I5
  'puzzle-plug', // I6
  'shield', // I7
  'lightbulb', // I8
] as const
export type IconKey = (typeof ICON_KEYS)[number]

/** Surface tint of a `card-task`, matching components.md. */
export type CapabilityTint = 'teal' | 'sun' | 'mint' | 'neutral'
/** Brand gradient for a blog cover kit, matching tokens.md `--gradient-cover-*`. */
export type CoverGradient = 'teal' | 'sun' | 'mint'

// ---------------------------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------------------------

/** Public projection of a media row: never the storage key, bucket or internal id. */
export type MediaAsset = Readonly<{
  url: string
  width: number
  height: number
  /** Required per locale before a media can be used on a published document. */
  alt: string
  /** Tiny data URL for `next/image` blur placeholders, `null` when not generated. */
  blurDataUrl: string | null
}>

export type SeoFields = Readonly<{
  metaTitle: string
  metaDescription: string
  /** `null` falls back to the generated `next/og` card. */
  ogImage: MediaAsset | null
  /** Advanced override, `null` uses the route's own URL. */
  canonicalUrl: string | null
  noindex: boolean
}>

/**
 * Placeholder for the structured rich text document. The editor ticket decides the final node
 * set; consumers must treat it as opaque and render it only through the shared renderer.
 */
export type RichTextNode = Readonly<{
  type: string
  text?: string
  attrs?: Readonly<Record<string, string | number | boolean | null>>
  marks?: readonly Readonly<{ type: string }>[]
  content?: readonly RichTextNode[]
}>
export type RichTextDocument = Readonly<{ type: 'doc'; content: readonly RichTextNode[] }>

export type StepItem = Readonly<{ title: string; body: string }>
export type CardItem = Readonly<{ title: string; body: string }>
export type IconCardItem = Readonly<{ title: string; body: string; icon: IconKey }>
/** A navigation target resolved to a locale-aware pathname in code, not stored as a URL. */
export type PageLinkTarget = 'home' | 'product' | 'services' | 'work' | 'blog' | 'about' | 'contact'
export type LabelledLink = Readonly<{ label: string; target: PageLinkTarget }>

/** Optional page sections add a visibility toggle. Everything else is always rendered. */
export type Toggleable<T> = Readonly<T & { visible: boolean }>

// ---------------------------------------------------------------------------------------------
// Site settings (singleton). Lead routing (inbox emails) and SMTP are admin-only and never here.
// ---------------------------------------------------------------------------------------------

export type SiteSettingsDTO = Readonly<{
  locale: ContentLocale
  brand: Readonly<{
    siteName: string
    defaultOgImage: MediaAsset | null
    /** Organisation logo for JSON-LD. */
    logo: MediaAsset | null
  }>
  contact: Readonly<{
    email: string
    /** Business hours text for the locale, `null` hides the line. */
    businessHours: string | null
    address: string | null
    legalEntity: Readonly<{ name: string; registrationNumber: string | null }> | null
  }>
  whatsapp: Readonly<{
    /** E.164, for example `+6280000000000`. */
    number: string
    templates: Readonly<{
      general: string
      product: string
      thankYou: string
      /** One message per service, auto-listed from Services. `{service name}` is substituted. */
      services: readonly Readonly<{ serviceSlug: string; message: string }>[]
    }>
  }>
  social: Readonly<{
    instagram: string | null
    linkedin: string | null
    tiktok: string | null
    youtube: string | null
    x: string | null
  }>
  features: Readonly<{
    showTeam: boolean
    showSelectedWork: boolean
    enableLogoIntro: boolean
    enableRealtimeSino: boolean
    enableStickyCtaBar: boolean
  }>
  analytics: Readonly<{ enabled: boolean; umamiWebsiteId: string | null }>
  seo: Readonly<{
    /** Contains `{title}`, for example `{title} | Sineva`. */
    titleTemplate: string
    defaultDescription: string
    /** Off on preview and staging. */
    indexable: boolean
  }>
  verification: Readonly<{ googleSearchConsoleToken: string | null }>
}>

// ---------------------------------------------------------------------------------------------
// Page content, one document per page and locale. Sections are fixed in code (no page builder);
// the CMS edits the text inside them. Lists that come from collections (capabilities, FAQ, work,
// posts, industries) are not repeated here: the section carries only its heading copy.
// ---------------------------------------------------------------------------------------------

export const PAGE_KEYS = [
  'home',
  'product',
  'servicesOverview',
  'about',
  'contact',
  'thankYou',
  'notFound',
  'privacy',
  'blogIndex',
  'workIndex',
] as const
export type PageKey = (typeof PAGE_KEYS)[number]

type PageBase<K extends PageKey> = Readonly<{
  key: K
  locale: ContentLocale
  seo: SeoFields
}>

type Hero = Readonly<{
  eyebrow: string | null
  headline: string
  lead: string
  primaryCtaLabel: string
}>
type SectionIntro = Readonly<{ title: string; intro: string | null }>
type FinalCta = Readonly<{
  headline: string
  body: string
  primaryCtaLabel: string
  secondaryCtaLabel: string | null
}>
type EmptyStatePage = Readonly<{ title: string; intro: string; emptyState: string }>

export type PathCard = Readonly<{
  eyebrow: string | null
  title: string
  body: string
  ctaLabel: string
  pose: PoseKey
}>

export type HomePageContent = PageBase<'home'> &
  Readonly<{
    hero: Hero & Readonly<{ secondaryCtaLabel: string | null; poster: MediaAsset | null }>
    twoPaths: Readonly<{ product: PathCard; services: PathCard }>
    meetSino: Readonly<{ title: string; body: string }>
    capabilities: SectionIntro
    howWeWork: Readonly<{ title: string; steps: readonly StepItem[] }>
    whoWeHelp: Readonly<{ title: string; cards: readonly IconCardItem[] }>
    selectedWork: Toggleable<SectionIntro>
    fromBlog: Toggleable<Readonly<{ title: string }>>
    faq: SectionIntro
    finalCta: FinalCta & Readonly<{ whatsappCtaLabel: string }>
  }>

export type ProductLaunchStatus = 'coming_soon' | 'live'
export type MockupBubble = Readonly<{ from: 'user' | 'sino'; text: string }>

export type ProductPageContent = PageBase<'product'> &
  Readonly<{
    /** `live` switches CTAs from the waitlist to "Try". */
    productStatus: ProductLaunchStatus
    hero: Hero &
      Readonly<{
        waitlistIntro: string
        /** Phone mockup screen content: up to 4 chat bubbles and 3 floating chips. */
        mockup: Readonly<{ bubbles: readonly MockupBubble[]; chips: readonly string[] }>
      }>
    capabilities: SectionIntro
    howItWorks: Readonly<{ title: string; steps: readonly StepItem[] }>
    madeForYou: SectionIntro
    control: Readonly<{ title: string; features: readonly IconCardItem[] }>
    comparison: Toggleable<{
      title: string
      columns: readonly string[]
      rows: readonly Readonly<{ label: string; cells: readonly string[] }>[]
    }>
    faq: SectionIntro
    finalCta: FinalCta
  }>

export type ServicesOverviewPageContent = PageBase<'servicesOverview'> &
  Readonly<{
    hero: Hero
    /** Intro to the three services, which come from `listServices`. */
    servicesIntro: Readonly<{ title: string; body: string }>
    howWeWork: Readonly<{ title: string; steps: readonly StepItem[] }>
    whoWeHelp: Readonly<{ title: string; cards: readonly IconCardItem[] }>
    selectedWork: Toggleable<SectionIntro>
    faq: SectionIntro
    finalCta: FinalCta
  }>

export type AboutPageContent = PageBase<'about'> &
  Readonly<{
    hero: Readonly<{ title: string; lead: string; scene: MediaAsset | null }>
    story: RichTextDocument
    mission: Readonly<{ title: string; body: string }>
    values: Readonly<{ title: string; items: readonly CardItem[] }>
    meetSino: Readonly<{ title: string; body: string }>
    /** Members come from `listTeam`. Also gated by `features.showTeam` in site settings. */
    team: Toggleable<Readonly<{ title: string }>>
    finalCta: FinalCta
  }>

/** Consent label with an inline link to the privacy policy, split so no markup is stored. */
export type ConsentLabel = Readonly<{ before: string; linkLabel: string; after: string }>

export type ContactPageContent = PageBase<'contact'> &
  Readonly<{
    /** Up to 3 meta chips above the headline. */
    metaChips: readonly string[]
    headline: string
    lead: string
    steps: readonly StepItem[]
    /** Only set when the Founder approves an SLA, otherwise `null` and the line is hidden. */
    responseTimeText: string | null
    form: Readonly<{ intro: string; consentLabel: ConsentLabel }>
  }>

export type ThankYouPageContent = PageBase<'thankYou'> &
  Readonly<{
    headline: string
    body: string
    whatsappCtaLabel: string
    nextLinks: readonly LabelledLink[]
  }>

export type NotFoundPageContent = PageBase<'notFound'> &
  Readonly<{ headline: string; body: string; links: readonly LabelledLink[] }>

export type PrivacyPageContent = PageBase<'privacy'> &
  Readonly<{
    body: RichTextDocument
    /** ISO date, `YYYY-MM-DD`. */
    effectiveDate: string
  }>

export type BlogIndexPageContent = PageBase<'blogIndex'> & EmptyStatePage
export type WorkIndexPageContent = PageBase<'workIndex'> & EmptyStatePage

export type PageContentMap = {
  home: HomePageContent
  product: ProductPageContent
  servicesOverview: ServicesOverviewPageContent
  about: AboutPageContent
  contact: ContactPageContent
  thankYou: ThankYouPageContent
  notFound: NotFoundPageContent
  privacy: PrivacyPageContent
  blogIndex: BlogIndexPageContent
  workIndex: WorkIndexPageContent
}

/**
 * Sections the editor can switch off, per page. The `visible` flag is required on each by the
 * `Toggleable` type; this list lets tests assert it on fixtures at runtime.
 */
export const OPTIONAL_PAGE_SECTIONS = {
  home: ['selectedWork', 'fromBlog'],
  product: ['comparison'],
  servicesOverview: ['selectedWork'],
  about: ['team'],
  contact: [],
  thankYou: [],
  notFound: [],
  privacy: [],
  blogIndex: [],
  workIndex: [],
} as const satisfies Record<PageKey, readonly string[]>

// ---------------------------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------------------------

export type ServiceSummary = Readonly<{
  slug: string
  locale: ContentLocale
  title: string
  summary: string
  icon: IconKey
  pose: PoseKey
}>

export type ServiceDetail = ServiceSummary &
  Readonly<{
    problems: readonly CardItem[]
    deliverables: readonly string[]
    process: readonly StepItem[]
    /** Not localised: tool names stay as written. */
    tools: readonly string[]
    ctaLabel: string
    seo: SeoFields
  }>

export type ProductCapability = Readonly<{
  /** Stable key, not a database id. */
  key: string
  /** Phrased as a request to Sino, for example "Sino, reply to today's customer chats". */
  title: string
  body: string
  tint: CapabilityTint
  pose: PoseKey
  /** Up to 4 lines shown in the phone mockup. */
  mockupLines: readonly string[]
  featured: boolean
}>

/** Product page tab. The contact segment list is a fixed enum in code, not this collection. */
export type Industry = Readonly<{ key: string; label: string; exampleDay: string }>

export type FaqItem = Readonly<{ question: string; answer: RichTextDocument }>
/** `home`, `product`, `services` or `service:<slug>`. */
export type FaqTag = 'home' | 'product' | 'services' | `service:${string}`

export type WorkProjectType = 'internal-demo' | 'client'

export type WorkSummary = Readonly<{
  slug: string
  locale: ContentLocale
  title: string
  summary: string
  /** `internal-demo` shows the "Internal demo project" badge (FR-PF-03). */
  projectType: WorkProjectType
  cover: MediaAsset | null
  stack: readonly string[]
  /** Slug of the related service, `null` when the work is not tied to one. */
  serviceSlug: string | null
  featured: boolean
}>

export type WorkDetail = WorkSummary &
  Readonly<{
    challenge: string
    solution: string
    result: string
    gallery: readonly MediaAsset[]
    demoUrl: string | null
    seo: SeoFields
  }>

export type Category = Readonly<{ slug: string; name: string }>

/** Author projection: name, role and photo only, never the email or the user id. */
export type AuthorSummary = Readonly<{
  name: string
  role: string | null
  photo: MediaAsset | null
}>

export type PostCover =
  | Readonly<{ kind: 'media'; media: MediaAsset }>
  | Readonly<{ kind: 'cover-kit'; pose: PoseKey; gradient: CoverGradient }>

export type PostSummary = Readonly<{
  slug: string
  locale: ContentLocale
  title: string
  excerpt: string
  cover: PostCover | null
  category: Category | null
  author: AuthorSummary | null
  /** ISO 8601 timestamp. */
  publishedAt: string
  readingMinutes: number
}>

export type PostDetail = PostSummary &
  Readonly<{
    body: RichTextDocument
    /** ISO 8601 timestamp, `null` when never edited after publishing. */
    updatedAt: string | null
    seo: SeoFields
  }>

export type PostPage = Readonly<{
  posts: readonly PostSummary[]
  /** Total published posts matching the filter, across all pages. */
  total: number
  page: number
  pageSize: number
}>

export type TeamMember = Readonly<{
  name: string
  role: string
  bio: string | null
  photo: MediaAsset | null
  socialUrl: string | null
}>
