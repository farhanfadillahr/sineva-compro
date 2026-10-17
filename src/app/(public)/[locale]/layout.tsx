import type { Metadata } from 'next'
import type { CSSProperties, ReactNode } from 'react'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { SinoLaunchOverlay } from '@/components/mascot/sino-launch/sino-launch-overlay'
import { LogoIntro } from '@/components/brand/logo-intro'
import { LogoIntroGateScript, LogoIntroShell } from '@/components/brand/logo-intro-server'
import { FloatingWhatsApp } from '@/components/layout/floating-whatsapp'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { SkipLink } from '@/components/layout/skip-link'
import { routing } from '@/i18n/routing'
import { getContentSource } from '@/lib/content-source'
import { getRobots } from '@/lib/robots-policy'
import { buildRootMetadata } from '@/lib/site-metadata'
import { PreviewBar } from '@/components/admin/preview-bar'
import { isPreviewRequest } from '@/features/cms/preview.server'
import { buildSiteJsonLd } from '@/lib/site-json-ld'
import { serializeJsonLd } from '@/components/sections/_internal/faq'
import { getSiteUrl } from '@/lib/site-url'
import { geistMono, plusJakartaSans } from '@/styles/fonts'
import { ThemeScript } from '@/components/theme/theme-script'
import Script from 'next/script'
import '../../globals.css'

const googleTagManagerId = 'GTM-PXDTM2T7'

// SITE_URL and SITE_INDEXABLE are read when this module's metadata is generated (at build for
// prerendered pages), so changing either takes a new deployment to show up. An unsupported
// locale gets the brand defaults: the layout itself answers 404 for it.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const settings = hasLocale(routing.locales, locale)
    ? await getContentSource().getSiteSettings(locale)
    : null
  return buildRootMetadata({ settings, siteUrl: getSiteUrl(), robots: getRobots() })
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
  const [settings, services, work, productPage, preview] = await Promise.all([
    content.getSiteSettings(locale),
    content.listServices(locale),
    content.listWork({ locale }),
    content.getPage('product', locale),
    isPreviewRequest(),
  ])
  // Once the product is live there is no waitlist: the footer drops its "Join the waitlist" link.
  const showWaitlist = productPage?.productStatus !== 'live'
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
        <ThemeScript />
        <LogoIntroGateScript
          enabled={settings?.features.enableLogoIntro ?? false}
          force={process.env.LOGO_INTRO_FORCE === '1'}
        />
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${googleTagManagerId}');`,
          }}
        />
      </head>
      {/* Utilities sit in a higher cascade layer than the shared base body rule (admin colours). */}
      <body className="flex min-h-svh flex-col bg-canvas text-text">
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${googleTagManagerId}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
            title="Google Tag Manager"
          />
        </noscript>
        {/* First in <body>: covers the page from the first paint when the gate marked the document. */}
        <LogoIntroShell />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(buildSiteJsonLd(getSiteUrl(), settings)),
          }}
        />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SkipLink />
          <SiteHeader
            services={navServices}
            whatsapp={settings?.whatsapp ?? null}
            showWork={showWork}
            showWaitlist={showWaitlist}
          />
          {/* Every page renders its own main landmark, which is the skip link's target. */}
          <div className="flex-1">{children}</div>
          <SiteFooter
            settings={settings}
            services={navServices}
            showWork={showWork}
            showWaitlist={showWaitlist}
          />
          <FloatingWhatsApp whatsapp={settings?.whatsapp ?? null} services={navServices} />
          {/* Last in the tree so it never changes tab order; it renders nothing until it plays. */}
          <LogoIntro />
          <SinoLaunchOverlay />
          {/* Editors only: Draft Mode plus a valid admin session (CPR-106). */}
          {preview ? <PreviewBar /> : null}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
