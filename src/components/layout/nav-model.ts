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

export type NavModel = Readonly<{
  product: Readonly<{
    items: readonly MenuLink[]
    promo: Readonly<{ href: string; eyebrow: string; title: string; description: string }>
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

const productItems = [
  { key: 'customerChat', icon: 'chat-bubble' },
  { key: 'socialMedia', icon: 'megaphone' },
  { key: 'salesFollowUp', icon: 'chart-rising' },
  { key: 'financeAdmin', icon: 'coin-wallet' },
  { key: 'operations', icon: 'calendar' },
] as const satisfies readonly { key: string; icon: IconKey }[]

/**
 * Navigation content for both the desktop dropdowns and the mobile accordions. Product items are
 * UI chrome from messages; the service entries come from the content source so a renamed or
 * added service shows up without a code change.
 */
export function useNavModel(services: readonly NavService[]): NavModel {
  const t = useTranslations('Nav')
  return {
    product: {
      items: productItems.map(({ key, icon }) => ({
        key,
        href: PRODUCT_HREF,
        icon,
        title: t(`productMenu.items.${key}.title`),
        description: t(`productMenu.items.${key}.description`),
      })),
      promo: {
        href: PRODUCT_HREF,
        eyebrow: t('productMenu.promo.eyebrow'),
        title: t('productMenu.promo.title'),
        description: t('productMenu.promo.description'),
      },
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
