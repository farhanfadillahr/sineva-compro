import type { Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'
import { cache } from 'react'
import { AppLink } from '@/components/layout/app-link'
import {
  buildNotFoundMetadata,
  loadNotFoundPage,
} from '@/components/pages/not-found/not-found-model'
import { NotFoundView } from '@/components/pages/not-found/not-found-view'
import { routing } from '@/i18n/routing'
import { getContentSource } from '@/lib/content-source'

// A not-found boundary receives no params, so the locale comes from the request. An unknown value
// falls back to the default locale: this page must render for any URL, never throw. `cache` lets
// generateMetadata and the page share one read.
const load = cache(async () => {
  const [requested, t] = await Promise.all([getLocale(), getTranslations('NotFound')])
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale
  const page = await loadNotFoundPage(getContentSource(), locale, {
    title: t('title'),
    body: t('body'),
    home: t('home'),
  })
  return page
})

export async function generateMetadata(): Promise<Metadata> {
  return buildNotFoundMetadata(await load())
}

export default async function PublicNotFound() {
  return <NotFoundView page={await load()} linkComponent={AppLink} />
}
