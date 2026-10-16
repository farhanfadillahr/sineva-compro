/**
 * Field descriptors shared by every CMS form: the admin renders a form from a descriptor and the
 * server validates the submitted JSON against the same descriptor, so the two can never drift.
 *
 * Pure module (no `server-only`, no React): it runs in server actions, client forms and unit tests.
 * Admin messages are Indonesian (PRD FR-ADM-05). Public copy fields reject em and en dashes
 * (FR-COPY-01) through the shared dash rule.
 */
import { findForbiddenDashes, FORBIDDEN_DASH_MESSAGE } from '../../lib/copy/dash-rule'
import { parseRichText } from './rich-text'

export type TextFormat = 'email' | 'url' | 'e164' | 'date' | 'token' | 'slug' | 'path'

export type TextField = Readonly<{
  kind: 'text'
  label: string
  max: number
  /** Empty input fails instead of becoming `null` or `''`. */
  required?: boolean
  /** Empty input is stored as `null` (optional content the site hides while empty). */
  nullable?: boolean
  multiline?: boolean
  /** Defaults to true: public copy rejects em and en dashes. */
  publicCopy?: boolean
  format?: TextFormat
  /** Word limit from docs/design/copywriting.md (headlines, CTA labels). */
  maxWords?: number
  /** Keep leading and trailing spaces (text joined to a link, for example). */
  keepSpaces?: boolean
  hint?: string
  adminOnly?: boolean
}>
export type BooleanField = Readonly<{
  kind: 'boolean'
  label: string
  hint?: string
  adminOnly?: boolean
}>
export type SelectField = Readonly<{
  kind: 'select'
  label: string
  options: readonly Readonly<{ value: string; label: string }>[]
  nullable?: boolean
  hint?: string
}>
export type MediaField = Readonly<{
  kind: 'media'
  label: string
  hint?: string
  adminOnly?: boolean
}>
export type RichTextField = Readonly<{ kind: 'richText'; label: string; hint?: string }>
export type ListField = Readonly<{
  kind: 'list'
  label: string
  item: FieldSchema
  min?: number
  max: number
  /** Label of one item in the editor, for example "Langkah". */
  itemLabel?: string
  /** Items are managed by the system (one per service, for example): no add, remove or move. */
  fixed?: boolean
  /** Key of an item's text field shown as the item title in the editor. */
  titleKey?: string
  hint?: string
}>
export type ObjectField = Readonly<{
  kind: 'object'
  label?: string
  fields: Readonly<Record<string, FieldSchema>>
  hint?: string
  /** Server rejects a change from a non-Admin, and the form hides it. */
  adminOnly?: boolean
  /** Optional section: the form shows the `visible` toggle of the value as the section switch. */
  collapsible?: boolean
}>
export type FieldSchema =
  TextField | BooleanField | SelectField | MediaField | RichTextField | ListField | ObjectField

/** How a media field is stored: a library reference, or a file shipped in `public/`. */
export type MediaValue =
  | Readonly<{ kind: 'media'; id: string }>
  | Readonly<{ kind: 'static'; url: string; width: number; height: number; alt: string }>
  | null

export type FieldErrors = Record<string, string>
export type ParseResult<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const EMAIL =
  /^[^\s@<>()[\]\\,;:"]{1,64}@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i
/** E.164: plus, country code that does not start with 0, 8 to 15 digits in total. */
export const E164 = /^\+[1-9]\d{7,14}$/
const TOKEN = /^[A-Za-z0-9._:-]+$/
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DATE = /^\d{4}-\d{2}-\d{2}$/

export function isEmail(value: string): boolean {
  return value.length <= 254 && EMAIL.test(value)
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

/** Parses and normalises an E.164 number. Spaces, dots, dashes and brackets are removed first. */
export function parseE164(input: string): string | null {
  const compact = input.trim().replace(/[\s().-]/g, '')
  return E164.test(compact) ? compact : null
}

function validDate(value: string) {
  if (!DATE.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

const formatMessage: Record<TextFormat, string> = {
  email: 'Masukkan alamat email yang valid.',
  url: 'Masukkan URL lengkap yang diawali https://.',
  e164: 'Gunakan format internasional, misalnya +6281234567890.',
  date: 'Gunakan tanggal yang valid (YYYY-MM-DD).',
  token: 'Gunakan huruf, angka, titik, titik dua, garis bawah atau tanda hubung.',
  slug: 'Gunakan huruf kecil, angka dan tanda hubung, misalnya ai-build.',
  path: 'Gunakan path yang diawali /, tanpa domain, spasi atau query.',
}

function checkFormat(format: TextFormat, value: string): string | null {
  switch (format) {
    case 'email':
      return isEmail(value) ? value.toLowerCase() : null
    case 'url':
      return isHttpUrl(value) ? value : null
    case 'e164':
      return parseE164(value)
    case 'date':
      return validDate(value) ? value : null
    case 'token':
      return TOKEN.test(value) ? value : null
    case 'slug':
      return SLUG.test(value) ? value : null
    case 'path':
      return /^\/(?!\/)[A-Za-z0-9\-._~/%]*$/.test(value) ? value : null
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export function parseMediaValue(input: unknown): MediaValue | undefined {
  if (input === null || input === undefined) return null
  if (!isRecord(input)) return undefined
  if (input.kind === 'media' && typeof input.id === 'string' && UUID.test(input.id))
    return { kind: 'media', id: input.id.toLowerCase() }
  if (
    input.kind === 'static' &&
    typeof input.url === 'string' &&
    /^\/(?!\/)[A-Za-z0-9\-._~/]+$/.test(input.url) &&
    Number.isInteger(input.width) &&
    Number.isInteger(input.height) &&
    (input.width as number) > 0 &&
    (input.height as number) > 0 &&
    typeof input.alt === 'string' &&
    input.alt.trim() &&
    input.alt.length <= 200 &&
    !findForbiddenDashes(input.alt).length
  )
    return {
      kind: 'static',
      url: input.url,
      width: input.width as number,
      height: input.height as number,
      alt: input.alt,
    }
  return undefined
}

type Context = { errors: FieldErrors; isAdmin: boolean; previous: unknown }

const join = (path: string, key: string | number) => (path ? `${path}.${key}` : String(key))

function parseField(schema: FieldSchema, input: unknown, path: string, ctx: Context): unknown {
  const fail = (message: string) => {
    ctx.errors[path || '$'] ??= message
    return undefined
  }
  switch (schema.kind) {
    case 'text': {
      if (input !== null && input !== undefined && typeof input !== 'string')
        return fail('Nilai tidak valid.')
      const value = schema.keepSpaces ? (input ?? '') : (input ?? '').trim()
      if (!value.trim()) {
        if (schema.required) return fail(`${schema.label} wajib diisi.`)
        return schema.nullable ? null : schema.keepSpaces ? value : ''
      }
      if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value))
        return fail('Teks memuat karakter kontrol.')
      if (!schema.multiline && /[\r\n]/.test(value)) return fail('Gunakan satu baris saja.')
      if (Array.from(value).length > schema.max) return fail(`Maksimal ${schema.max} karakter.`)
      if (schema.maxWords && value.split(/\s+/).length > schema.maxWords)
        return fail(`Maksimal ${schema.maxWords} kata.`)
      if (schema.publicCopy !== false && findForbiddenDashes(value).length)
        return fail(FORBIDDEN_DASH_MESSAGE)
      if (schema.format) {
        const normalised = checkFormat(schema.format, value)
        return normalised === null ? fail(formatMessage[schema.format]) : normalised
      }
      return value
    }
    case 'boolean':
      return typeof input === 'boolean' ? input : fail('Nilai tidak valid.')
    case 'select': {
      if ((input === null || input === '' || input === undefined) && schema.nullable) return null
      return typeof input === 'string' && schema.options.some((option) => option.value === input)
        ? input
        : fail(`Pilih ${schema.label.toLowerCase()} dari daftar.`)
    }
    case 'media': {
      const value = parseMediaValue(input)
      return value === undefined ? fail('Media tidak valid.') : value
    }
    case 'richText': {
      const result = parseRichText(input)
      return result.ok ? result.value : fail(result.message)
    }
    case 'list': {
      if (!Array.isArray(input)) return fail('Daftar tidak valid.')
      if (input.length > schema.max) return fail(`Maksimal ${schema.max} item.`)
      if (input.length < (schema.min ?? 0)) return fail(`Minimal ${schema.min} item.`)
      const previous = Array.isArray(ctx.previous) ? ctx.previous : []
      return input.map((item, index) =>
        parseField(schema.item, item, join(path, index), { ...ctx, previous: previous[index] }),
      )
    }
    case 'object': {
      if (!isRecord(input)) return fail('Data tidak valid.')
      const previous = isRecord(ctx.previous) ? ctx.previous : undefined
      const output: Record<string, unknown> = {}
      for (const [key, field] of Object.entries(schema.fields)) {
        const child = { ...ctx, previous: previous?.[key] }
        if ('adminOnly' in field && field.adminOnly && !ctx.isAdmin) {
          // A non-Admin keeps the stored value whatever the form sent.
          if (previous && key in previous) {
            output[key] = previous[key]
            continue
          }
          ctx.errors[join(path, key)] = 'Bagian ini hanya dapat diubah Admin.'
          continue
        }
        output[key] = parseField(field, input[key], join(path, key), child)
      }
      return output
    }
  }
}

/**
 * Validates `input` against `schema`. Unknown keys are dropped. `previous` is the stored value:
 * Admin-only sections are taken from it for non-Admins, so an Editor can never change them even
 * by crafting the request.
 */
export function parseFields<T>(
  schema: FieldSchema,
  input: unknown,
  options: { isAdmin: boolean; previous?: unknown } = { isAdmin: true },
): ParseResult<T> {
  const ctx: Context = { errors: {}, isAdmin: options.isAdmin, previous: options.previous }
  const value = parseField(schema, input, '', ctx)
  return Object.keys(ctx.errors).length
    ? { ok: false, errors: ctx.errors }
    : { ok: true, value: value as T }
}

/** JSON with object keys sorted: PostgreSQL `jsonb` does not keep the key order it was given. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (isRecord(value))
    return `{${Object.keys(value)
      .sort()
      .filter((key) => value[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`
  return JSON.stringify(value) ?? 'null'
}

/** Top-level keys whose content differs. Audit entries record names only, never values. */
export function changedKeys(before: unknown, after: unknown): string[] {
  const a = isRecord(before) ? before : {}
  const b = isRecord(after) ? after : {}
  return [...new Set([...Object.keys(a), ...Object.keys(b)])]
    .filter((key) => canonicalJson(a[key]) !== canonicalJson(b[key]))
    .sort()
}

/** Every media reference in a value, with a stable field path for `media_usage`. */
export function collectMedia(
  schema: FieldSchema,
  value: unknown,
  path = '',
): { field: string; mediaId: string }[] {
  if (schema.kind === 'media') {
    const media = parseMediaValue(value)
    return media?.kind === 'media' ? [{ field: path || 'media', mediaId: media.id }] : []
  }
  if (schema.kind === 'list' && Array.isArray(value))
    return value.flatMap((item, index) => collectMedia(schema.item, item, join(path, index)))
  if (schema.kind === 'object' && isRecord(value))
    return Object.entries(schema.fields).flatMap(([key, field]) =>
      collectMedia(field, value[key], join(path, key)),
    )
  return []
}

/**
 * Stored form of a public DTO: every `MediaAsset` at a media field becomes a static media value.
 * Used to seed the tables from the static launch content.
 */
export function storedFromDto(schema: FieldSchema, value: unknown): unknown {
  if (schema.kind === 'media') {
    if (!isRecord(value)) return null
    return {
      kind: 'static',
      url: value.url,
      width: value.width,
      height: value.height,
      alt: value.alt,
    }
  }
  if (schema.kind === 'list' && Array.isArray(value))
    return value.map((item) => storedFromDto(schema.item, item))
  if (schema.kind === 'object' && isRecord(value))
    return Object.fromEntries(
      Object.entries(schema.fields).map(([key, field]) => [key, storedFromDto(field, value[key])]),
    )
  return value
}

/** A blank value for a descriptor, used when an editor adds a list item. */
export function emptyValue(schema: FieldSchema): unknown {
  switch (schema.kind) {
    case 'text':
      return schema.nullable ? null : ''
    case 'boolean':
      return false
    case 'select':
      return schema.nullable ? null : (schema.options[0]?.value ?? '')
    case 'media':
      return null
    case 'richText':
      return { type: 'doc', content: [] }
    case 'list':
      return []
    case 'object':
      return Object.fromEntries(
        Object.entries(schema.fields).map(([key, field]) => [key, emptyValue(field)]),
      )
  }
}

/** Shortcuts so descriptors read as a form, not as object plumbing. */
export const f = {
  text: (label: string, max: number, extra: Omit<TextField, 'kind' | 'label' | 'max'> = {}) =>
    ({ kind: 'text', label, max, ...extra }) as const satisfies TextField,
  required: (label: string, max: number, extra: Omit<TextField, 'kind' | 'label' | 'max'> = {}) =>
    ({ kind: 'text', label, max, required: true, ...extra }) as const satisfies TextField,
  optional: (label: string, max: number, extra: Omit<TextField, 'kind' | 'label' | 'max'> = {}) =>
    ({ kind: 'text', label, max, nullable: true, ...extra }) as const satisfies TextField,
  boolean: (label: string, hint?: string) =>
    ({ kind: 'boolean', label, ...(hint ? { hint } : {}) }) as const satisfies BooleanField,
  select: (
    label: string,
    options: readonly Readonly<{ value: string; label: string }>[],
    extra: Omit<SelectField, 'kind' | 'label' | 'options'> = {},
  ) => ({ kind: 'select', label, options, ...extra }) as const satisfies SelectField,
  media: (label: string, hint?: string) =>
    ({ kind: 'media', label, ...(hint ? { hint } : {}) }) as const satisfies MediaField,
  richText: (label: string, hint?: string) =>
    ({ kind: 'richText', label, ...(hint ? { hint } : {}) }) as const satisfies RichTextField,
  list: (
    label: string,
    item: FieldSchema,
    max: number,
    extra: Omit<ListField, 'kind' | 'label' | 'item' | 'max'> = {},
  ) => ({ kind: 'list', label, item, max, ...extra }) as const satisfies ListField,
  object: (
    fields: Readonly<Record<string, FieldSchema>>,
    extra: Omit<ObjectField, 'kind' | 'fields'> = {},
  ) => ({ kind: 'object', fields, ...extra }) as const satisfies ObjectField,
}
