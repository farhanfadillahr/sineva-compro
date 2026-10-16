import type { Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { AppLink } from '@/components/layout/app-link'
import { getServicesListModel } from '@/components/pages/services/get-services-model'
import { servicesLabelsFromMessages } from '@/components/pages/services/services-labels'
import { buildServicesListMetadata } from '@/components/pages/services/services-metadata'
import { ServicesListView } from '@/components/pages/services/services-list-view'
import { routing } from '@/i18n/routing'

type ServicesPageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: ServicesPageProps): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const model = await getServicesListModel(locale)
  if (!model) notFound()
  return buildServicesListMetadata(model.page, model.settings)
}

export default async function ServicesPage({ params }: ServicesPageProps) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const [model, messages] = await Promise.all([getServicesListModel(locale), getMessages()])
  // A locale without Services content has no page: 404 rather than an empty shell.
  if (!model) notFound()

  return (
    <ServicesListView
      model={model}
      labels={servicesLabelsFromMessages(messages)}
      linkComponent={AppLink}
    />
  )
}
