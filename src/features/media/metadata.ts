import { validateCopyField } from '../../lib/copy/dash-rule'
import { routing } from '../../i18n/routing'
export class MediaError extends Error {
  constructor(
    public readonly code: 'INVALID' | 'NOT_FOUND' | 'IN_USE' | 'UNAVAILABLE',
    message: string,
    public readonly usages: readonly { entity: string; entityId: string; label: string }[] = [],
  ) {
    super(message)
  }
}
export type MediaMetadata = {
  translations: Record<string, { alt: string; caption: string }>
  focalX: number
  focalY: number
  credit: string
}
function invalid(): never {
  throw new MediaError(
    'INVALID',
    'Metadata media tidak valid. Lengkapi alt dan periksa batas isian.',
  )
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid()
  return value as Record<string, unknown>
}
function text(value: unknown, max: number, required = false) {
  if (typeof value !== 'string') return invalid()
  const next = value.trim()
  if (
    next.length > max ||
    (required && !next) ||
    !validateCopyField(next).ok ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(next)
  )
    return invalid()
  return next
}
export function parseMediaMetadata(
  input: unknown,
  requireAlt = false,
  locales: readonly string[] = routing.locales,
): MediaMetadata {
  const data = object(input)
  if (
    Object.keys(data).some((key) => !['translations', 'focalX', 'focalY', 'credit'].includes(key))
  )
    return invalid()
  const translated = object(data.translations)
  if (Object.keys(translated).some((key) => !locales.includes(key))) return invalid()
  const translations: MediaMetadata['translations'] = {}
  for (const locale of locales) {
    const value = object(translated[locale])
    if (Object.keys(value).some((key) => !['alt', 'caption'].includes(key))) return invalid()
    translations[locale] = {
      alt: text(value.alt, 200, requireAlt),
      caption: text(value.caption ?? '', 1000),
    }
  }
  for (const key of ['focalX', 'focalY'])
    if (
      typeof data[key] !== 'number' ||
      !Number.isFinite(data[key]) ||
      Number(data[key]) < 0 ||
      Number(data[key]) > 1
    )
      return invalid()
  return {
    translations,
    focalX: Number(data.focalX),
    focalY: Number(data.focalY),
    credit: text(data.credit ?? '', 160),
  }
}
export function mediaId(input: unknown) {
  if (typeof input !== 'string' || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(input))
    throw new MediaError('INVALID', 'ID media tidak valid.')
  return input
}
