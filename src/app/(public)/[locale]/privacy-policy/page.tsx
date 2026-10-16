import type { Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { buildPrivacyMetadata } from '@/components/pages/legal/privacy-metadata'
import { PrivacyView } from '@/components/pages/legal/privacy-view'
import { routing } from '@/i18n/routing'
import { getContentSource } from '@/lib/content-source'

type PrivacyPageProps = { params: Promise<{ locale: string }> }

/** The page and `generateMetadata` both read this: one fetch per request, not two. */
const loadPrivacy = cache(async (locale: string) => {
  if (!hasLocale(routing.locales, locale)) notFound()
  const source = getContentSource()
  const [page, settings] = await Promise.all([
    source.getPage('privacy', locale),
    source.getSiteSettings(locale),
  ])
  // A locale without privacy content has no page: 404 rather than an empty policy.
  if (!page) notFound()
  return { page, settings }
})

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params
  const { page, settings } = await loadPrivacy(locale)
  return buildPrivacyMetadata(page, settings)
}

export default async function PrivacyPolicyPage({ params }: PrivacyPageProps) {
  const { locale } = await params
  const { page } = await loadPrivacy(locale)
  return <PrivacyView page={page} />
}
