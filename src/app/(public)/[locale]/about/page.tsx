import type { Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { AppLink } from '@/components/layout/app-link'
import { aboutLabelsFromMessages } from '@/components/pages/about/about-labels'
import { buildAboutMetadata } from '@/components/pages/about/about-metadata'
import { AboutView } from '@/components/pages/about/about-view'
import { getAboutModel } from '@/components/pages/about/get-about-model'
import { routing } from '@/i18n/routing'

type AboutPageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const model = await getAboutModel(locale)
  if (!model) notFound()
  return buildAboutMetadata(model.page, model.settings)
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const [model, messages] = await Promise.all([getAboutModel(locale), getMessages()])
  // A locale without About content has no page: 404 rather than an empty shell.
  if (!model) notFound()

  return (
    <AboutView model={model} labels={aboutLabelsFromMessages(messages)} linkComponent={AppLink} />
  )
}
