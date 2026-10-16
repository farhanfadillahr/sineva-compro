import type { Metadata } from 'next'
import type {
  BlogIndexPageContent,
  MediaAsset,
  PostDetail,
  SiteSettingsDTO,
} from '@/features/content/types'
import { blogPostHref } from './blog-model'
import { blogCanonicalPath, type BlogQuery } from './blog-query'

const ogImages = (image: MediaAsset | null) =>
  image ? [{ url: image.url, width: image.width, height: image.height, alt: image.alt }] : undefined

/**
 * Metadata of `/blog`. The title is `absolute`: the content already holds the full title
 * ("... | Sineva") and the layout sets no title template, so a template would print the brand
 * twice. Robots stay with the layout (the whole site is noindex until launch); the page adds its
 * own noindex only when the editor sets it.
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
  const canonical = isMainList && seo.canonicalUrl ? seo.canonicalUrl : blogCanonicalPath(query)
  const ogImage = seo.ogImage ?? settings?.brand.defaultOgImage ?? null
  return {
    title: { absolute: seo.metaTitle },
    description: seo.metaDescription,
    alternates: { canonical },
    ...(seo.noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: 'website',
      title: seo.metaTitle,
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
  const canonical = seo.canonicalUrl ?? blogPostHref(post.slug)
  return {
    title: { absolute: seo.metaTitle },
    description: seo.metaDescription,
    alternates: { canonical },
    ...(seo.noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: 'article',
      title: seo.metaTitle,
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
