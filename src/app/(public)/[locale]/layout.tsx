import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { geistMono, plusJakartaSans } from '@/styles/fonts'
import '../../globals.css'

export const metadata: Metadata = {
  title: 'Sineva',
  robots: { index: false, follow: false },
}
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}
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
  return (
    <html lang={locale} className={`${plusJakartaSans.variable} ${geistMono.variable}`}>
      {/* Utilities sit in a higher cascade layer than the shared base body rule (admin colours). */}
      <body className="bg-canvas text-text">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
