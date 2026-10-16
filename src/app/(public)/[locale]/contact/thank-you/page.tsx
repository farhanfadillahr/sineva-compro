import type { Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { AppLink } from '@/components/layout/app-link'
import { buildThankYouMetadata } from '@/components/pages/contact/contact-metadata'
import { getThankYouModel } from '@/components/pages/contact/get-contact-model'
import { ThankYouView } from '@/components/pages/contact/thank-you-view'
import { routing } from '@/i18n/routing'

type ThankYouPageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: ThankYouPageProps): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const model = await getThankYouModel(locale)
  if (!model) notFound()
  return buildThankYouMetadata(model.page, model.settings)
}

export default async function ThankYouPage({ params }: ThankYouPageProps) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const model = await getThankYouModel(locale)
  if (!model) notFound()
  return <ThankYouView model={model} linkComponent={AppLink} />
}
