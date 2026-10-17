import { timingSafeEqual } from 'node:crypto'

/**
 * Vercel Cron calls with `Authorization: Bearer <CRON_SECRET>`. Without a configured secret every
 * request is refused, so the job can never run unauthenticated. Constant-time comparison.
 */
export function isCronRequest(
  headers: Headers,
  secret: string | undefined = process.env.CRON_SECRET,
): boolean {
  if (!secret) return false
  const expected = Buffer.from(`Bearer ${secret}`)
  const actual = Buffer.from(headers.get('authorization') ?? '')
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
