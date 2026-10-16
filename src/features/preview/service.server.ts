import 'server-only'
import { and, eq, lt } from 'drizzle-orm'
import { routing } from '../../i18n/routing'
import { db } from '../../lib/db/client.server'
import { readServerEnv } from '../../env/server'
import { PAGE_KEYS, type ContentLocale, type PageKey } from '../content/types'
import { CmsError } from '../cms/errors'
import { parseFields, type FieldErrors } from '../cms/fields'
import { cmsReader } from '../cms/mutation.server'
import { localizedPath } from '../cms/paths'
import { pageSchemas, PAGE_ROUTES } from '../pages/fields'
import { serviceGlobalSchema, serviceLocaleSchema, serviceSlugField } from '../services/fields'
import { previewState } from './schema'
import { PREVIEW_TTL_MS, signPreviewToken, verifyPreviewToken } from './token'

export const PREVIEW_COOKIE = 'sineva_preview'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const secret = () => readServerEnv(process.env).authSecret

export type PreviewKind = 'page' | 'service'
export type ServicePreview = {
  slug: string
  global: Record<string, unknown>
  local: Record<string, unknown>
}

function prefixed(errors: FieldErrors, prefix: string) {
  return Object.fromEntries(Object.entries(errors).map(([k, v]) => [`${prefix}${k}`, v]))
}

/** Validates the unsaved form state like a draft: formats and copy rules, not completeness. */
function parseState(kind: PreviewKind, target: string, data: unknown) {
  if (kind === 'page') {
    const parsed = parseFields(pageSchemas[target as PageKey], data, {
      isAdmin: true,
      partial: true,
    })
    if (!parsed.ok)
      throw new CmsError(
        'INVALID',
        'Perbaiki isian yang ditandai sebelum pratinjau.',
        prefixed(parsed.errors, 'data.'),
      )
    return parsed.value as Record<string, unknown>
  }
  const input = isRecord(data) ? data : {}
  const slug = parseFields<string>(serviceSlugField, input.slug)
  const global = parseFields(serviceGlobalSchema, input.global, { isAdmin: true, partial: true })
  const local = parseFields(serviceLocaleSchema, input.local, { isAdmin: true, partial: true })
  const errors = {
    ...(slug.ok ? {} : { slug: Object.values(slug.errors)[0] }),
    ...(global.ok ? {} : prefixed(global.errors, 'global.')),
    ...(local.ok ? {} : prefixed(local.errors, 'local.')),
  }
  if (!slug.ok || !global.ok || !local.ok)
    throw new CmsError('INVALID', 'Perbaiki isian yang ditandai sebelum pratinjau.', errors)
  return { slug: slug.value, global: global.value, local: local.value }
}

function publicPath(
  kind: PreviewKind,
  target: string,
  locale: string,
  data: Record<string, unknown>,
) {
  if (kind === 'service') return localizedPath(locale, `/services/${String(data.slug)}`)
  const route = PAGE_ROUTES.find((r) => r.key === target)
  // The 404 page has no address of its own: any unknown path renders it.
  return localizedPath(locale, route?.path ?? '/preview-not-found')
}

/**
 * Stores the editor's current form state for ten minutes and returns the signed link that opens
 * it. Previews never write to the published content and never refresh caches.
 */
export async function createPreview(headers: Headers, input: unknown) {
  const actor = await cmsReader(headers)
  const data = isRecord(input) ? input : {}
  const kind = data.kind === 'page' || data.kind === 'service' ? data.kind : null
  const target = typeof data.target === 'string' ? data.target : ''
  const locale = typeof data.locale === 'string' ? data.locale : ''
  if (
    !kind ||
    !(routing.locales as readonly string[]).includes(locale) ||
    (kind === 'page' && !(PAGE_KEYS as readonly string[]).includes(target)) ||
    (kind === 'service' && target !== 'new' && !UUID.test(target))
  )
    throw new CmsError('INVALID', 'Pratinjau tidak valid.')
  const state = parseState(kind, target, data.data)
  const expiresAt = new Date(Date.now() + PREVIEW_TTL_MS)
  await db.delete(previewState).where(lt(previewState.expiresAt, new Date()))
  const [row] = await db
    .insert(previewState)
    .values({ kind, target, locale, data: state, createdBy: actor.id, expiresAt })
    .returning({ id: previewState.id })
  const token = signPreviewToken(secret(), row.id, expiresAt.getTime())
  return { url: `/admin/preview/state?${new URLSearchParams({ token })}`, expiresAt }
}

/** Resolves a signed token to its stored state, only while both are valid. */
export async function openPreview(token: unknown) {
  const id = verifyPreviewToken(secret(), token)
  if (!id) return null
  const [row] = await db.select().from(previewState).where(eq(previewState.id, id))
  if (!row || row.expiresAt.getTime() <= Date.now()) return null
  const data = row.data as Record<string, unknown>
  return {
    path: publicPath(row.kind as PreviewKind, row.target, row.locale, data),
    expiresAt: row.expiresAt,
  }
}

/**
 * The unsaved state for this preview request, if it targets `kind`/`target`/`locale`. Callers
 * must have checked `isPreviewRequest()` (Draft Mode plus a valid admin session) first.
 */
export async function previewStateFor(kind: PreviewKind, locale: ContentLocale, target?: string) {
  try {
    const { cookies } = await import('next/headers')
    const id = verifyPreviewToken(secret(), (await cookies()).get(PREVIEW_COOKIE)?.value)
    if (!id) return null
    const [row] = await db
      .select()
      .from(previewState)
      .where(
        and(eq(previewState.id, id), eq(previewState.kind, kind), eq(previewState.locale, locale)),
      )
    if (!row || row.expiresAt.getTime() <= Date.now()) return null
    if (target !== undefined && row.target !== target) return null
    return { target: row.target, data: row.data as Record<string, unknown> }
  } catch {
    return null
  }
}
