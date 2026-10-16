import type { Metadata } from 'next'
import type { SiteSettingsDTO } from '../features/content/types'

type Robots = { index: boolean; follow: boolean }

const BRAND = 'Sineva'
const DEFAULT_TITLE_TEMPLATE = `%s | ${BRAND}`
const DEFAULT_DESCRIPTION =
  'A little help with everyday work. Explore AI support that fits your business, meet Sino, and tell us what would make your day easier.'
// Same file and size as `brand.defaultOgImage` in the static site settings. Used only when a
// locale has no settings at all, so social cards never go out without an image.
const FALLBACK_OG_IMAGE = { url: '/og/default.png', width: 1200, height: 630 } as const

// Content stores the pattern as `{title} | Sineva`; Next.js wants `%s`. A pattern without the
// placeholder would print the same text for every page, so it is ignored for the default.
function titleTemplate(settings: SiteSettingsDTO | null): string {
  const pattern = settings?.seo.titleTemplate
  return pattern?.includes('{title}') ? pattern.replace('{title}', '%s') : DEFAULT_TITLE_TEMPLATE
}

/**
 * Site-wide metadata: the defaults every page inherits.
 *
 * Gotcha: Next.js merges metadata per top-level key, not deeply. A page that sets its own
 * `openGraph` replaces this `openGraph` completely (no `locale` carried over), and `twitter` is
 * only inherited whole. The per-page builders therefore repeat `siteName` and the image
 * themselves; what is set here is what a page gets when it says nothing, such as the
 * work placeholder.
 *
 * The title template does not touch the per-page titles: content already holds the full
 * "Page topic | Sineva" text and the pages pass it as `title.absolute`, which skips the template.
 */
export function buildRootMetadata({
  settings,
  siteUrl,
  robots,
}: {
  settings: SiteSettingsDTO | null
  siteUrl: URL
  robots: Robots
}): Metadata {
  const siteName = settings?.brand.siteName ?? BRAND
  const description = settings?.seo.defaultDescription ?? DEFAULT_DESCRIPTION
  const image = settings?.brand.defaultOgImage ?? FALLBACK_OG_IMAGE
  const alt = settings?.brand.defaultOgImage?.alt
  return {
    metadataBase: siteUrl,
    title: { default: siteName, template: titleTemplate(settings) },
    description,
    robots,
    openGraph: {
      type: 'website',
      siteName,
      // `en_US` rather than a bare `en`: Open Graph wants language_TERRITORY.
      locale: 'en_US',
      title: siteName,
      description,
      images: [{ url: image.url, width: image.width, height: image.height, alt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteName,
      description,
      images: [image.url],
    },
  }
}
