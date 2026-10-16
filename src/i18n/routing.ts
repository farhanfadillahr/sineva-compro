import { defineRouting } from 'next-intl/routing'

// URL table of docs/design/page-patterns.md section 1. Keys are the internal pathnames used by
// `Link`/`getPathname`. English keeps its URLs without a prefix; Indonesian is served under `/id`
// with the paths below (PRD Rev. 4, CPR-101).
const englishPathnames = {
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
 * Indonesian pathnames (table column "`id` URL"). Values omit the `/id` prefix because next-intl
 * adds it itself for non-default locales (`/layanan` is served at `/id/layanan`, `/` at `/id`).
 */
export const indonesianPathnames: Readonly<Record<keyof typeof englishPathnames, string>> = {
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

const pathnames = Object.fromEntries(
  Object.entries(englishPathnames).map(([key, en]) => [
    key,
    { en, id: indonesianPathnames[key as keyof typeof englishPathnames] },
  ]),
) as { [K in keyof typeof englishPathnames]: { en: (typeof englishPathnames)[K]; id: string } }

export const routing = defineRouting({
  locales: ['en', 'id'],
  defaultLocale: 'en',
  // English has no prefix; Indonesian lives under /id. `/en/...` redirects to the unprefixed URL.
  localePrefix: 'as-needed',
  // `/` always serves English (FR-I18N-02): no Accept-Language redirect, so it stays cacheable.
  // Visitors switch with the language switcher, which opens the counterpart page.
  localeDetection: false,
  localeCookie: false,
  // No automatic `Link` header: it would announce `/id/blog/<slug>` for articles that exist in one
  // locale only. Pages set their own hreflang through `languageAlternates` (src/i18n/href.ts).
  alternateLinks: false,
  pathnames,
})

export type Locale = (typeof routing.locales)[number]
