import type { PostDetail, SiteSettingsDTO } from '@/features/content/types'
import { postShareImage } from './blog-metadata'
import { blogPostHref } from './blog-model'

/** Used only when the site settings are missing for the locale. */
const FALLBACK_PUBLISHER = 'Sineva'

export type BlogPostingJsonLd = Readonly<{
  '@context': 'https://schema.org'
  '@type': 'BlogPosting'
  mainEntityOfPage: Readonly<{ '@type': 'WebPage'; '@id': string }>
  headline: string
  description: string
  url: string
  inLanguage: string
  datePublished: string
  dateModified: string
  image?: readonly string[]
  author: Readonly<{ '@type': 'Person' | 'Organization'; name: string }>
  publisher: Readonly<{
    '@type': 'Organization'
    name: string
    logo?: Readonly<{ '@type': 'ImageObject'; url: string }>
  }>
  articleSection?: string
}>

/** schema.org and Google want absolute urls; content holds root-relative or absolute ones. */
const absolute = (value: string, siteUrl: URL) => new URL(value, siteUrl).toString()

/**
 * schema.org BlogPosting from the article only. Nothing is added that the page does not show: no
 * rating, comment count or word count. `image` is left out when the article has neither a cover,
 * an Open Graph image nor a site card, rather than pointing at a placeholder.
 */
export function buildBlogPostingJsonLd({
  post,
  settings,
  siteUrl,
}: {
  post: PostDetail
  settings: SiteSettingsDTO | null
  siteUrl: URL
}): BlogPostingJsonLd {
  const url = absolute(blogPostHref(post.slug), siteUrl)
  const image = postShareImage(post, settings)
  const publisherName = settings?.brand.siteName ?? FALLBACK_PUBLISHER
  const logo = settings?.brand.logo ?? null
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    headline: post.title,
    description: post.seo.metaDescription || post.excerpt,
    url,
    inLanguage: post.locale,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    ...(image ? { image: [absolute(image.url, siteUrl)] } : {}),
    author: post.author
      ? { '@type': 'Person', name: post.author.name }
      : { '@type': 'Organization', name: publisherName },
    publisher: {
      '@type': 'Organization',
      name: publisherName,
      ...(logo ? { logo: { '@type': 'ImageObject', url: absolute(logo.url, siteUrl) } } : {}),
    },
    ...(post.category ? { articleSection: post.category.name } : {}),
  }
}
