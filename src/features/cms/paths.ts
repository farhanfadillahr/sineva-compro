import { routing } from '../../i18n/routing'

/** Public path for a locale: no prefix for the default locale (`localePrefix: 'as-needed'`). */
export function localizedPath(locale: string, path: string) {
  return locale === routing.defaultLocale ? path : `/${locale}${path === '/' ? '' : path}`
}
