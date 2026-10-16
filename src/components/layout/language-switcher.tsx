'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { getPathname, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

/** Each language named in itself, so a visitor who cannot read the page still finds theirs. */
const LANGUAGE_NAMES: Record<string, string> = { en: 'English', id: 'Bahasa Indonesia' }

// Articles and projects are written per locale, so the same slug rarely exists in the other
// language: the switch opens that language's list instead of a likely 404.
const LIST_FOR_DETAIL: Record<string, string> = { '/blog/[slug]': '/blog', '/work/[slug]': '/work' }

/**
 * Opens the counterpart of the current page in the other locale (`/services` and
 * `/id/layanan`). Renders nothing while only one locale is enabled, so no dead control ships.
 * `full` spells the language out (mobile menu); otherwise it shows the short code (header).
 */
export function LanguageSwitcher({
  locales = routing.locales,
  full = false,
  className,
}: {
  locales?: readonly string[]
  full?: boolean
  className?: string
}) {
  const t = useTranslations('Nav')
  const locale = useLocale()
  const pathname = usePathname()
  const params = useParams()
  const target = locales.find((code) => code !== locale)
  if (locales.length <= 1 || !target) return null

  const list = LIST_FOR_DETAIL[pathname]
  const { locale: _locale, ...routeParams } = params ?? {}
  void _locale
  // The final URL of the other locale, built here rather than by next-intl's Link: its forced
  // prefix would send English through a `/en/...` redirect. Switching language reloads the
  // locale layout anyway, so a plain anchor loses nothing.
  const href = getPathname({
    locale: target as never,
    href: (list ?? { pathname, params: routeParams }) as never,
  })
  const name = LANGUAGE_NAMES[target] ?? target

  return (
    <a
      href={href}
      hrefLang={target}
      // Only the spelled-out name is in the other language; the short form's label is not.
      lang={full ? target : undefined}
      // The visible code starts the accessible name (WCAG 2.5.3, label in name).
      aria-label={
        full ? undefined : `${target.toUpperCase()}, ${t('switchLanguage', { language: name })}`
      }
      data-slot="language-switcher"
      className={className}
    >
      {full ? name : target.toUpperCase()}
    </a>
  )
}
