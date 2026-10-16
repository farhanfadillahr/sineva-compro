import type { Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { AppLink } from '@/components/layout/app-link'
import { SinoHero } from '@/components/mascot/sino-hero'
import { getHomeModel } from '@/components/pages/home/get-home-model'
import { homeLabelsFromMessages } from '@/components/pages/home/home-labels'
import { buildHomeMetadata } from '@/components/pages/home/home-metadata'
import { HOME_HREFS } from '@/components/pages/home/home-model'
import { HomeView } from '@/components/pages/home/home-view'
import { getPathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

type HomePageProps = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const model = await getHomeModel(locale)
  if (!model) notFound()
  return buildHomeMetadata(model.page, model.settings)
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const [model, messages] = await Promise.all([getHomeModel(locale), getMessages()])
  // A locale without Home content has no page: 404 rather than an empty shell.
  if (!model) notFound()

  return (
    <HomeView
      model={model}
      labels={homeLabelsFromMessages(messages)}
      // Realtime Sino is a site setting (CPR-29). Off, or settings missing for the locale, leaves
      // the slot out: the hero renders the poster alone and the 3D code is never requested.
      heroCanvas={model.settings?.features.enableRealtimeSino ? <SinoHero /> : undefined}
      linkComponent={AppLink}
      // The sticky bar is a client component, so it gets a ready, localised href.
      stickyPrimaryHref={getPathname({ locale, href: HOME_HREFS.contact })}
    />
  )
}
