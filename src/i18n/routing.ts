import { defineRouting } from 'next-intl/routing'

// English URL table of docs/design/page-patterns.md section 1. Keys are the internal
// pathnames used by `Link`/`getPathname`; with a single locale each maps to itself.
const pathnames = {
  '/': '/',
  '/products/ai-agents': '/products/ai-agents',
  '/services': '/services',
  '/services/[slug]': '/services/[slug]',
  '/work': '/work',
  '/work/[slug]': '/work/[slug]',
  '/blog': '/blog',
  '/blog/[slug]': '/blog/[slug]',
  '/about': '/about',
  '/contact': '/contact',
  '/contact/thank-you': '/contact/thank-you',
  '/privacy-policy': '/privacy-policy',
} as const

/**
 * Future Indonesian pathnames (table column "Future `id` URL"), documented but NOT enabled.
 * Values omit the `/id` prefix because next-intl adds it itself for non-default locales
 * (`/layanan` is served at `/id/layanan`, `/` at `/id`); writing `/id/layanan` here would
 * produce `/id/id/layanan`. Enabling `id` is a data-only change: add 'id' to `locales`, then
 * turn every `pathnames` entry into `{ en: <entry>, id: plannedIdPathnames[<key>] }`. English
 * URLs stay unchanged because the default locale has no prefix. Kept outside `routing` so no
 * `id` route is reachable until that change.
 */
export const plannedIdPathnames: Readonly<Record<keyof typeof pathnames, string>> = {
  '/': '/',
  '/products/ai-agents': '/produk/ai-agents',
  '/services': '/layanan',
  '/services/[slug]': '/layanan/[slug]',
  '/work': '/karya',
  '/work/[slug]': '/karya/[slug]',
  '/blog': '/blog',
  '/blog/[slug]': '/blog/[slug]',
  '/about': '/tentang',
  '/contact': '/kontak',
  '/contact/thank-you': '/kontak/terima-kasih',
  '/privacy-policy': '/kebijakan-privasi',
}

export const routing = defineRouting({
  locales: ['en'],
  defaultLocale: 'en',
  // The default locale has no prefix; `/en/...` is redirected to the unprefixed URL.
  localePrefix: 'as-needed',
  // One locale: nothing to detect, so `/` serves English directly (no cookie or
  // Accept-Language redirect) and no NEXT_LOCALE cookie is written.
  localeDetection: false,
  localeCookie: false,
  alternateLinks: false,
  pathnames,
})

export type Locale = (typeof routing.locales)[number]
