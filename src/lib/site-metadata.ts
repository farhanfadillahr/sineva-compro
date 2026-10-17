import type { Metadata } from 'next'
import type { SiteSettingsDTO } from '../features/content/types'

type Robots = { index: boolean; follow: boolean }

const BRAND = 'Sineva'
const DEFAULT_TITLE_TEMPLATE = `%s | ${BRAND}`
const DEFAULT_DESCRIPTION =
  'Find practical ways AI can help with the tasks that fill your day. Meet Sino and book a free consultation.'
// Same file and size as `brand.defaultOgImage` in the static site settings. Used only when a
// locale has no settings at all, so social cards never go out without an image.
const FALLBACK_OG_IMAGE = { url: '/og/default-v008.png', width: 1200, height: 630 } as const

// Content stores the pattern as `{title} | Sineva`; Next.js wants `%s`. A pattern without the
// placeholder would print the same text for every page, so it is ignored for the default.
function titleTemplate(settings: SiteSettingsDTO | null): string {
  return nextTemplate(settings?.seo.titleTemplate)
}
function nextTemplate(pattern: string | undefined): string {
  return pattern?.includes('{title}') ? pattern.replace('{title}', '%s') : DEFAULT_TITLE_TEMPLATE
}

/**
 * Applies a stored title pattern (`{title} | Sineva`) to a meta title. Shared by the site and the
 * admin snippet preview so both always show the same title. A title that already carries the
 * template's text around it (content saved before the template applied) is returned as is
 * instead of printing the brand twice.
 */
export function applyTitleTemplate(metaTitle: string, pattern: string | undefined): string {
  const [before, after] = nextTemplate(pattern).split('%s') as [string, string]
  if (metaTitle.startsWith(before) && metaTitle.endsWith(after)) return metaTitle
  return `${before}${metaTitle}${after}`
}

/**
 * The full page title: the editor's meta title inside the SEO title template (CPR-104). Pages pass
 * the result as `title.absolute` and reuse it for Open Graph and Twitter, which Next.js never runs
 * through the template, so the tab, search result and social card always match.
 */
export function renderTitle(metaTitle: string, settings: SiteSettingsDTO | null): string {
  return applyTitleTemplate(metaTitle, settings?.seo.titleTemplate)
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
 * Pages build their title with `renderTitle` (the same template) and pass it as `title.absolute`,
 * because Open Graph and Twitter titles never go through the template and must match the tab.
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
