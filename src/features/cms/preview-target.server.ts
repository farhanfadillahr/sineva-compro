import 'server-only'
import { routing } from '../../i18n/routing'
import { db } from '../../lib/db/client.server'
import type { ContentLocale } from '../content/types'
import { documentConfigs, isDocumentName } from '../documents/configs'
import { readDocuments } from '../documents/service.server'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Locale prefix for a public path: none for the default locale (`as-needed`). */
export function localizedPath(locale: ContentLocale, path: string) {
  return locale === routing.defaultLocale ? path : `/${locale}${path === '/' ? '' : path}`
}

/**
 * The public path to preview, resolved from the database, never from the request: a preview
 * link cannot be turned into an open redirect.
 */
export async function previewPath(params: URLSearchParams): Promise<string | null> {
  const kind = params.get('kind')
  const locale = params.get('locale') ?? routing.defaultLocale
  if (!(routing.locales as readonly string[]).includes(locale)) return null
  const id = params.get('id') ?? ''
  if (isDocumentName(kind) && UUID.test(id)) {
    const [item] = await readDocuments(db, kind, [locale], { ids: [id] })
    const slug = item?.locales[locale]?.draftSlug
    return slug
      ? localizedPath(locale as ContentLocale, `${documentConfigs[kind].publicPrefix}${slug}`)
      : null
  }
  return null
}
