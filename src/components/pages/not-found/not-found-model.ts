import type { Metadata } from 'next'
import type { PublicContentSource } from '@/features/content/public'
import type { ContentLocale, NotFoundPageContent } from '@/features/content/types'

/** The strings of the `NotFound` message namespace the fallback page is built from. */
export type NotFoundFallbackMessages = Readonly<{ title: string; body: string; home: string }>

/**
 * The 404 content page, or a minimal one built from the messages when the source has none.
 *
 * Why a fallback instead of `notFound()`: this runs while rendering the not-found boundary itself.
 * Calling `notFound()` from there would throw out of the boundary and turn a missing page into a
 * 500. A content source that is empty for a locale must still get a page with a way back.
 */
export async function loadNotFoundPage(
  source: Pick<PublicContentSource, 'getPage'>,
  locale: ContentLocale,
  fallback: NotFoundFallbackMessages,
): Promise<NotFoundPageContent> {
  const page = await source.getPage('notFound', locale)
  if (page) return page
  return {
    key: 'notFound',
    locale,
    seo: {
      metaTitle: fallback.title,
      metaDescription: fallback.body,
      ogImage: null,
      canonicalUrl: null,
      noindex: true,
    },
    headline: fallback.title,
    body: fallback.body,
    links: [{ label: fallback.home, target: 'home' }],
  }
}

/**
 * Title and description from the content. `robots` is explicit even though Next.js adds a noindex
 * tag to a response with status 404: that tag is injected only when the status is known before
 * streaming starts, and a 404 page must never be indexed whichever way the response was built.
 * The title is `absolute` because the content already holds the full "... | Sineva" title.
 */
export function buildNotFoundMetadata(page: NotFoundPageContent): Metadata {
  return {
    title: { absolute: page.seo.metaTitle },
    description: page.seo.metaDescription,
    robots: { index: false, follow: false },
  }
}
