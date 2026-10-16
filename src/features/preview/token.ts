import { createHmac, timingSafeEqual } from 'node:crypto'

/** Preview links live for ten minutes. */
export const PREVIEW_TTL_MS = 10 * 60 * 1000
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function signature(secret: string, id: string, expires: number) {
  return createHmac('sha256', secret).update(`preview:${id}:${expires}`).digest('base64url')
}

/** `<id>.<expires ms>.<hmac>`: tampering with any part breaks the signature. */
export function signPreviewToken(secret: string, id: string, expires: number): string {
  return `${id}.${expires}.${signature(secret, id, expires)}`
}

/** The state id when the token is authentic and not expired, otherwise `null`. */
export function verifyPreviewToken(
  secret: string,
  token: unknown,
  now = Date.now(),
): string | null {
  if (typeof token !== 'string') return null
  const [id, rawExpires, given, ...rest] = token.split('.')
  if (rest.length || !id || !UUID.test(id) || !/^\d{13}$/.test(rawExpires ?? '') || !given)
    return null
  const expires = Number(rawExpires)
  if (expires <= now) return null
  const expected = Buffer.from(signature(secret, id, expires))
  const actual = Buffer.from(given)
  return expected.length === actual.length && timingSafeEqual(expected, actual) ? id : null
}
