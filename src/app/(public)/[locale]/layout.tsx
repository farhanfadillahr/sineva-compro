import type { Metadata } from 'next'
import type { CSSProperties, ReactNode } from 'react'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { LogoIntro } from '@/components/brand/logo-intro'
import { LogoIntroGateScript, LogoIntroShell } from '@/components/brand/logo-intro-server'
import { FloatingWhatsApp } from '@/components/layout/floating-whatsapp'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { SkipLink } from '@/components/layout/skip-link'
import { routing } from '@/i18n/routing'
import { getContentSource } from '@/lib/content-source'
import { getRobots } from '@/lib/robots-policy'
import { getSiteUrl } from '@/lib/site-url'
import { geistMono, plusJakartaSans } from '@/styles/fonts'
import '../../globals.css'

// Both values are read once when the layout module is evaluated (at build for prerendered pages),
// so changing SITE_URL or SITE_INDEXABLE takes a new deployment to show up.
export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: 'Sineva',
  robots: getRobots(),
}
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

// Height of the header bar. Pages whose hero should sit behind the transparent header pull
// themselves up with `-mt-(--header-height)` and pad their top by the same amount.
const headerVars = { '--header-height': '4.5rem' } as CSSProperties

export default async function PublicLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const messages = await getMessages()

  const content = getContentSource()
  const [settings, services, work] = await Promise.all([
    content.getSiteSettings(locale),
    content.listServices(locale),
    content.listWork({ locale }),
  ])
  // An empty list is the honest state before there are real projects: no link to an empty page.
  const showWork = work.length > 0
  // Only what the navigation needs crosses into the client components.
  const navServices = services.map(({ slug, title, summary, icon }) => ({
    slug,
    title,
    summary,
    icon,
  }))

  return (
    <html
      lang={locale}
      style={headerVars}
      // The header is sticky, so an in-page anchor would scroll its target under it: 6rem is the
      // 4.5rem bar plus breathing room, and applies to every heading and id target at once.
      className={`${plusJakartaSans.variable} ${geistMono.variable} scroll-pt-24`}
      // The logo intro gate sets data-logo-intro on <html> in <head>, before React hydrates it.
      suppressHydrationWarning
    >
      <head>
        <LogoIntroGateScript
          enabled={settings?.features.enableLogoIntro ?? false}
          force={process.env.LOGO_INTRO_FORCE === '1'}
        />
      </head>
      {/* Utilities sit in a higher cascade layer than the shared base body rule (admin colours). */}
      <body className="flex min-h-svh flex-col bg-canvas text-text">
        {/* First in <body>: covers the page from the first paint when the gate marked the document. */}
        <LogoIntroShell />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SkipLink />
          <SiteHeader
            services={navServices}
            whatsapp={settings?.whatsapp ?? null}
            showWork={showWork}
          />
          {/* Every page renders its own main landmark, which is the skip link's target. */}
          <div className="flex-1">{children}</div>
          <SiteFooter settings={settings} services={navServices} showWork={showWork} />
          <FloatingWhatsApp whatsapp={settings?.whatsapp ?? null} services={navServices} />
          {/* Last in the tree so it never changes tab order; it renders nothing until it plays. */}
          <LogoIntro />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
