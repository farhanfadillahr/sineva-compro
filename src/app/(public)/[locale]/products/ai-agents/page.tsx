import type { Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { AppLink } from '@/components/layout/app-link'
import { getProductModel } from '@/components/pages/product/get-product-model'
import { productLabelsFromMessages } from '@/components/pages/product/product-labels'
import { buildProductMetadata } from '@/components/pages/product/product-metadata'
import { PRODUCT_HREFS } from '@/components/pages/product/product-model'
import { ProductView } from '@/components/pages/product/product-view'
import { joinWaitlist } from '@/features/waitlist/actions'
import { getPathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

type ProductPageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const model = await getProductModel(locale)
  if (!model) notFound()
  return buildProductMetadata(model.page, model.settings)
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const [model, messages] = await Promise.all([getProductModel(locale), getMessages()])
  // A locale without Product content has no page: 404 rather than an empty shell.
  if (!model) notFound()

  return (
    <ProductView
      model={model}
      labels={productLabelsFromMessages(messages)}
      linkComponent={AppLink}
      // The waitlist form is a client component, so it gets a ready, localised href.
      privacyHref={getPathname({ locale, href: PRODUCT_HREFS.privacy })}
      joinWaitlist={joinWaitlist}
    />
  )
}
