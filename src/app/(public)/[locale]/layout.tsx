import type { Metadata } from 'next'
import type { CSSProperties, ReactNode } from 'react'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { FloatingWhatsApp } from '@/components/layout/floating-whatsapp'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { MAIN_CONTENT_ID, SkipLink } from '@/components/layout/skip-link'
import { routing } from '@/i18n/routing'
import { getContentSource } from '@/lib/content-source'
import { geistMono, plusJakartaSans } from '@/styles/fonts'
import '../../globals.css'

export const metadata: Metadata = {
  title: 'Sineva',
  robots: { index: false, follow: false },
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
  const [settings, services] = await Promise.all([
    content.getSiteSettings(locale),
    content.listServices(locale),
  ])
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
    >
      {/* Utilities sit in a higher cascade layer than the shared base body rule (admin colours). */}
      <body className="flex min-h-svh flex-col bg-canvas text-text">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SkipLink />
          <SiteHeader services={navServices} whatsapp={settings?.whatsapp ?? null} />
          {/* Skip-link target. Pages render their own <main>; this wrapper only receives focus. */}
          <div id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1 outline-none">
            {children}
          </div>
          <SiteFooter settings={settings} services={navServices} />
          <FloatingWhatsApp whatsapp={settings?.whatsapp ?? null} services={navServices} />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
