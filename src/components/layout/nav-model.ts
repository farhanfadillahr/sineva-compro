import { useTranslations } from 'next-intl'
import type { IconKey } from '@/features/content/types'

/** The part of a service the navigation needs; the layout projects it from `listServices`. */
export type NavService = Readonly<{ slug: string; title: string; summary: string; icon: IconKey }>

export type MenuLink = Readonly<{
  key: string
  href: string
  title: string
  description: string
  icon: IconKey
}>

/** Top-level links that are plain pages, in display order. Labels come from `Nav.<key>`. */
export type PlainLink = Readonly<{ key: 'work' | 'blog' | 'about'; href: string }>

export type NavModel = Readonly<{
  plainLinks: readonly PlainLink[]
  product: Readonly<{
    items: readonly MenuLink[]
    /** The waitlist card; `null` once the product is live (CPR-106). */
    promo: Readonly<{ href: string; eyebrow: string; title: string; description: string }> | null
  }>
  services: Readonly<{
    items: readonly MenuLink[]
    seeAll: Readonly<{ href: string; label: string }>
  }>
}>

// Hrefs are the internal pathnames of src/i18n/routing.ts. Anything built here must exist in that
// table, because AppLink skips the compile-time check of next-intl's typed Link.
const PRODUCT_HREF = '/products/ai-agents'
const SERVICES_HREF = '/services'

const plainLinks = [
  { key: 'work', href: '/work' },
  { key: 'blog', href: '/blog' },
  { key: 'about', href: '/about' },
] as const satisfies readonly PlainLink[]

const productItems = [
  { key: 'peopleExperience', icon: 'calendar' },
  { key: 'financialIntelligence', icon: 'coin-wallet' },
  { key: 'salesAcceleration', icon: 'chart-rising' },
  { key: 'socialContent', icon: 'megaphone' },
  { key: 'supportAutomation', icon: 'chat-bubble' },
  { key: 'enterpriseIntelligence', icon: 'lightbulb' },
] as const satisfies readonly { key: string; icon: IconKey }[]

/**
 * Navigation content for both the desktop dropdowns and the mobile accordions. Product items are
 * UI chrome from messages; the service entries come from the content source so a renamed or
 * added service shows up without a code change. The plain links are filtered here so the desktop
 * nav and the mobile menu can never disagree about Work.
 */
export function useNavModel(
  services: readonly NavService[],
  // Work is a link to a page that lists real projects. While there are none, the link and the page
  // would only show an empty state, so the layout turns it off. Defaults to shown.
  // The waitlist promo card only makes sense while the product is coming soon.
  { showWork = true, showWaitlist = true }: { showWork?: boolean; showWaitlist?: boolean } = {},
): NavModel {
  const t = useTranslations('Nav')
  return {
    plainLinks: plainLinks.filter((link) => showWork || link.key !== 'work'),
    product: {
      items: productItems.map(({ key, icon }) => ({
        key,
        href: PRODUCT_HREF,
        icon,
        title: t(`productMenu.items.${key}.title`),
        description: t(`productMenu.items.${key}.description`),
      })),
      promo: showWaitlist
        ? {
            href: PRODUCT_HREF,
            eyebrow: t('productMenu.promo.eyebrow'),
            title: t('productMenu.promo.title'),
            description: t('productMenu.promo.description'),
          }
        : null,
    },
    services: {
      items: services.map((service) => ({
        key: service.slug,
        href: `${SERVICES_HREF}/${service.slug}`,
        icon: service.icon,
        title: service.title,
        description: service.summary,
      })),
      seeAll: { href: SERVICES_HREF, label: t('servicesMenu.seeAll') },
    },
  }
}

/**
 * `aria-current` for a link: "page" on the exact page, "true" on a section that contains it
 * (the Work link while reading a project). Hrefs and pathnames are internal, locale-less.
 */
export function ariaCurrentFor(pathname: string | null, href: string): 'page' | 'true' | undefined {
  if (!pathname) return undefined
  if (pathname === href) return 'page'
  if (href !== '/' && pathname.startsWith(`${href}/`)) return 'true'
  return undefined
}
