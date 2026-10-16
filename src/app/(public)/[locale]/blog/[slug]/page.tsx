import type { Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { AppLink } from '@/components/layout/app-link'
import { blogLabelsFromMessages } from '@/components/pages/blog/blog-labels'
import { buildBlogPostMetadata } from '@/components/pages/blog/blog-metadata'
import { BLOG_FETCH_LIMIT } from '@/components/pages/blog/blog-model'
import { BlogPostView } from '@/components/pages/blog/blog-post-view'
import { getBlogPostModel } from '@/components/pages/blog/get-blog-model'
import { routing } from '@/i18n/routing'
import { getContentSource } from '@/lib/content-source'
import { getSiteUrl } from '@/lib/site-url'

type BlogPostPageProps = { params: Promise<{ locale: string; slug: string }> }

/**
 * One page per published article, for every locale. A slug that is not in the list is not
 * prerendered, and the page answers 404 for it when requested.
 */
export async function generateStaticParams() {
  const source = getContentSource()
  const perLocale = await Promise.all(
    routing.locales.map(async (locale) => {
      const { posts } = await source.listPosts({
        locale,
        page: 1,
        pageSize: BLOG_FETCH_LIMIT,
      })
      return posts.map(({ slug }) => ({ locale, slug }))
    }),
  )
  return perLocale.flat()
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { locale, slug } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const model = await getBlogPostModel(slug, locale)
  if (!model) notFound()
  return buildBlogPostMetadata(model.post, model.settings)
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { locale, slug } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  // The model is loaded first: an unknown slug must 404 before anything else is read.
  const model = await getBlogPostModel(slug, locale)
  if (!model) notFound()
  const messages = await getMessages()

  return (
    <BlogPostView
      model={model}
      labels={blogLabelsFromMessages(messages)}
      siteUrl={getSiteUrl()}
      linkComponent={AppLink}
    />
  )
}
