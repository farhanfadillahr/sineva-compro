import { getPathname } from './navigation'
import { routing, type Locale } from './routing'

type Pathname = keyof typeof routing.pathnames

/** A data-driven href, resolved to the internal pathname it belongs to. */
export type AppHref = {
  pathname: Pathname
  params?: Record<string, string>
  query?: Record<string, string>
  hash?: string
}

const PARAM = /\[(\w+)\]/g

// Static pathnames first, so `/contact/thank-you` never reads as a value of a `[slug]` pattern.
const patterns = (Object.keys(routing.pathnames) as Pathname[])
  .map((pathname) => ({
    pathname,
    names: [...pathname.matchAll(PARAM)].map((match) => match[1]),
    regex: new RegExp(`^${pathname.replace(PARAM, '([^/]+)').replace(/\/$/, '')}/?$`),
  }))
  .sort((a, b) => a.names.length - b.names.length)

/**
 * Internal pathname, params, query and hash of an app href such as `/services/ai-build` or
 * `/contact?service=ai-build`. next-intl only localizes hrefs it can look up in the pathname
 * table, so a string with a slug, a query or a hash would otherwise keep its English path under
 * `/id`. `null` for anything that is not one of the app's pages (external, mailto, unknown).
 */
export function parseAppHref(href: string): AppHref | null {
  if (!href.startsWith('/') || href.startsWith('//')) return null
  const url = new URL(href, 'http://app.invalid')
  for (const { pathname, names, regex } of patterns) {
    const match = regex.exec(url.pathname)
    if (!match) continue
    const parsed: AppHref = { pathname }
    if (names.length > 0)
      parsed.params = Object.fromEntries(
        names.map((name, i) => [name, decodeURIComponent(match[i + 1])]),
      )
    if (url.search) parsed.query = Object.fromEntries(url.searchParams)
    if (url.hash.length > 1) parsed.hash = url.hash.slice(1)
    return parsed
  }
  return null
}

/** The internal pathname of a template, with its params filled in (`/services/ai-build`). */
export function fillPathname(
  template: string,
  params: Readonly<Record<string, string | string[] | undefined>> | null | undefined,
): string {
  return template.replace(PARAM, (whole, name: string) => {
    const value = params?.[name]
    return typeof value === 'string' ? encodeURIComponent(value) : whole
  })
}

/** Public URL path of an app href in `locale`, with its `/id` prefix, query and hash. */
export function localizeHref(locale: Locale, href: string): string {
  const parsed = parseAppHref(href)
  if (!parsed) return href
  const { hash, ...rest } = parsed
  const path = getPathname({ locale, href: rest as never })
  return hash ? `${path}#${hash}` : path
}

/**
 * hreflang alternates of a page that exists in every locale, for `alternates.languages`. Blog
 * articles leave it out: they are written per locale, so the counterpart usually does not exist
 * (FR-I18N-05). `x-default` is English, which `/` serves without a redirect.
 */
export function languageAlternates(href: string): Record<string, string> {
  const languages: Record<string, string> = Object.fromEntries(
    routing.locales.map((locale) => [locale, localizeHref(locale, href)]),
  )
  return { ...languages, 'x-default': languages[routing.defaultLocale] }
}
