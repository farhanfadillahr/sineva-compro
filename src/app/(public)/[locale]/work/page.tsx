import type { Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { PublicPageShell } from '@/components/public/page-shell'
import { routing } from '@/i18n/routing'
import { getContentSource } from '@/lib/content-source'

const WORK_PATH = '/work'

type WorkPageProps = { params: Promise<{ locale: string }> }

/**
 * The page is still a placeholder shell (there is no project to show and the navigation hides
 * the link), so it is noindex whatever the content flag says: a search result pointing at an
 * empty page helps nobody. Drop the forced noindex together with the placeholder, when the page
 * gets its real content. The title is `absolute` because the content already holds the full
 * "... | Sineva" text.
 */
export async function generateMetadata({ params }: WorkPageProps): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const source = getContentSource()
  const [page, settings] = await Promise.all([
    source.getPage('workIndex', locale),
    source.getSiteSettings(locale),
  ])
  if (!page) notFound()
  const { seo } = page
  // Same fallback as the other pages: a page `openGraph` replaces the layout's, so the image and
  // site name are repeated here.
  const ogImage = seo.ogImage ?? settings?.brand.defaultOgImage ?? null
  return {
    title: { absolute: seo.metaTitle },
    description: seo.metaDescription,
    alternates: { canonical: seo.canonicalUrl ?? WORK_PATH },
    robots: { index: false, follow: false },
    openGraph: {
      type: 'website',
      title: seo.metaTitle,
      description: seo.metaDescription,
      url: seo.canonicalUrl ?? WORK_PATH,
      siteName: settings?.brand.siteName,
      images: ogImage
        ? [{ url: ogImage.url, width: ogImage.width, height: ogImage.height, alt: ogImage.alt }]
        : undefined,
    },
  }
}

export default function Page() {
  return <PublicPageShell page="work" />
}
