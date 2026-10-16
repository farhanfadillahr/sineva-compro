import type { Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { AppLink } from '@/components/layout/app-link'
import { blogLabelsFromMessages } from '@/components/pages/blog/blog-labels'
import { BlogListView } from '@/components/pages/blog/blog-list-view'
import { buildBlogListMetadata } from '@/components/pages/blog/blog-metadata'
import type { RawSearchParams } from '@/components/pages/blog/blog-query'
import { getBlogListModel } from '@/components/pages/blog/get-blog-model'
import { routing } from '@/i18n/routing'

type BlogPageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<RawSearchParams>
}

// Reading `searchParams` makes this page dynamic: `?category=` and `?page=` must be rendered on
// the server per request so the filtered list is in the HTML a crawler or a visitor without
// JavaScript receives. The model is read once per request and shared with generateMetadata.
const first = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? ''

export async function generateMetadata({ params, searchParams }: BlogPageProps): Promise<Metadata> {
  const [{ locale }, query] = await Promise.all([params, searchParams])
  if (!hasLocale(routing.locales, locale)) notFound()
  const model = await getBlogListModel(locale, first(query.category), first(query.page))
  if (!model) notFound()
  return buildBlogListMetadata(model.page, model.settings, model.query)
}

export default async function BlogPage({ params, searchParams }: BlogPageProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams])
  if (!hasLocale(routing.locales, locale)) notFound()
  const [model, messages] = await Promise.all([
    getBlogListModel(locale, first(query.category), first(query.page)),
    getMessages(),
  ])
  // A locale without Blog content has no page: 404 rather than an empty shell.
  if (!model) notFound()

  return (
    <BlogListView model={model} labels={blogLabelsFromMessages(messages)} linkComponent={AppLink} />
  )
}
