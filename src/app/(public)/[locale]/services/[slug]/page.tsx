import type { Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { AppLink } from '@/components/layout/app-link'
import { getServiceDetailModel } from '@/components/pages/services/get-services-model'
import { ServiceDetailView } from '@/components/pages/services/service-detail-view'
import { servicesLabelsFromMessages } from '@/components/pages/services/services-labels'
import { buildServiceDetailMetadata } from '@/components/pages/services/services-metadata'
import { SERVICES_HREFS, serviceContactHref } from '@/components/pages/services/services-model'
import { getPathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { getContentSource } from '@/lib/content-source'

type ServicePageProps = { params: Promise<{ locale: string; slug: string }> }

/**
 * One page per service the content source lists, for every locale. A slug that is not in the
 * list (including "web-development", which is part of AI Build) is not prerendered, and the
 * page answers 404 for it when requested.
 */
export async function generateStaticParams() {
  const source = getContentSource()
  const perLocale = await Promise.all(
    routing.locales.map(async (locale) => {
      const services = await source.listServices(locale)
      return services.map(({ slug }) => ({ locale, slug }))
    }),
  )
  return perLocale.flat()
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { locale, slug } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const model = await getServiceDetailModel(slug, locale)
  if (!model) notFound()
  return buildServiceDetailMetadata(model.service, model.settings)
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { locale, slug } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  // The model is loaded first: an unknown slug must 404 before anything else is read.
  const model = await getServiceDetailModel(slug, locale)
  if (!model) notFound()
  const messages = await getMessages()

  return (
    <ServiceDetailView
      model={model}
      labels={servicesLabelsFromMessages(messages)}
      linkComponent={AppLink}
      // The sticky bar is a client component, so it gets a ready, localised href.
      stickyPrimaryHref={serviceContactHref(
        model.service.slug,
        getPathname({ locale, href: SERVICES_HREFS.contact }),
      )}
    />
  )
}
