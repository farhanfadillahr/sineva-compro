import type { Metadata } from 'next'
import { renderTitle } from '@/lib/site-metadata'
import type {
  BlogIndexPageContent,
  MediaAsset,
  PostDetail,
  SiteSettingsDTO,
} from '@/features/content/types'
import { blogPostHref } from './blog-model'
import { BLOG_LIST_PATH, blogCanonicalPath, type BlogQuery } from './blog-query'
import { languageAlternates, localizeHref } from '@/i18n/href'

const ogImages = (image: MediaAsset | null) =>
  image ? [{ url: image.url, width: image.width, height: image.height, alt: image.alt }] : undefined

/**
 * Metadata of `/blog`. The title is the meta title inside the SEO title template (`renderTitle`),
 * passed as `absolute` and reused for Open Graph and Twitter so the tab, search result and social
 * card match. Robots stay with the layout (the whole site is noindex until launch); the page adds
 * its own noindex only when the editor sets it.
 *
 * The canonical depends on the view (see `blogCanonicalPath`). An editor override applies to the
 * unfiltered first page only: on a filtered or paginated view it would point at the wrong list.
 */
export function buildBlogListMetadata(
  page: BlogIndexPageContent,
  settings: SiteSettingsDTO | null,
  query: BlogQuery,
): Metadata {
  const { seo } = page
  const isMainList = query.category === null && query.page === 1
  const canonical =
    isMainList && seo.canonicalUrl
      ? seo.canonicalUrl
      : localizeHref(page.locale, blogCanonicalPath(query))
  const ogImage = seo.ogImage ?? settings?.brand.defaultOgImage ?? null
  return {
    title: { absolute: renderTitle(seo.metaTitle, settings) },
    description: seo.metaDescription,
    alternates: {
      canonical,
      // Lists are per locale, so only the main list has a counterpart worth announcing.
      ...(isMainList ? { languages: languageAlternates(BLOG_LIST_PATH) } : {}),
    },
    ...(seo.noindex ? { robots: { index: false, follow: false } } : {}),
    twitter: {
      card: 'summary_large_image',
      title: renderTitle(seo.metaTitle, settings),
      description: seo.metaDescription,
      images: ogImage ? [ogImage.url] : undefined,
    },
    openGraph: {
      type: 'website',
      title: renderTitle(seo.metaTitle, settings),
      description: seo.metaDescription,
      url: canonical,
      siteName: settings?.brand.siteName,
      images: ogImages(ogImage),
    },
  }
}

/** The image an article is shared with: its own Open Graph image, its cover, then the site card. */
export function postShareImage(post: PostDetail, settings: SiteSettingsDTO | null) {
  return (
    post.seo.ogImage ??
    (post.cover?.kind === 'media' ? post.cover.media : null) ??
    settings?.brand.defaultOgImage ??
    null
  )
}

export function buildBlogPostMetadata(
  post: PostDetail,
  settings: SiteSettingsDTO | null,
): Metadata {
  const { seo } = post
  const canonical = seo.canonicalUrl ?? localizeHref(post.locale, blogPostHref(post.slug))
  const ogImage = postShareImage(post, settings)
  return {
    title: { absolute: renderTitle(seo.metaTitle, settings) },
    description: seo.metaDescription,
    alternates: { canonical },
    ...(seo.noindex ? { robots: { index: false, follow: false } } : {}),
    twitter: {
      card: 'summary_large_image',
      title: renderTitle(seo.metaTitle, settings),
      description: seo.metaDescription,
      images: ogImage ? [ogImage.url] : undefined,
    },
    openGraph: {
      type: 'article',
      title: renderTitle(seo.metaTitle, settings),
      description: seo.metaDescription,
      url: canonical,
      siteName: settings?.brand.siteName,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? undefined,
      authors: post.author ? [post.author.name] : undefined,
      images: ogImages(postShareImage(post, settings)),
    },
  }
}
