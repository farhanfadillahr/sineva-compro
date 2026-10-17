import { readServerEnv } from '@/env/server'
import { AccessDeniedError } from '@/features/auth/access-errors'
import { exportWaitlist, readWaitlistFilters } from '@/features/waitlist/service.server'
import { toCsv } from '@/features/waitlist/csv'

export const dynamic = 'force-dynamic'

/** Admin-only CSV of the waitlist (Indonesian headers). Never cached, never public. */
export async function GET(request: Request) {
  readServerEnv(process.env)
  const params = Object.fromEntries(new URL(request.url).searchParams)
  try {
    const rows = await exportWaitlist(request.headers, readWaitlistFilters(params))
    const csv = toCsv(
      ['Email', 'Jenis bisnis', 'Bahasa', 'Persetujuan', 'Bergabung'],
      rows.map((r) => [
        r.email,
        r.segment,
        r.locale,
        r.consentAt.toISOString(),
        r.createdAt.toISOString(),
      ]),
    )
    return new Response(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="waitlist-${new Date().toISOString().slice(0, 10)}.csv"`,
        'cache-control': 'private, no-store',
        'x-content-type-options': 'nosniff',
      },
    })
  } catch (error) {
    if (error instanceof AccessDeniedError)
      return new Response(null, {
        status: error.code === 'UNAUTHORIZED' ? 401 : 403,
        headers: { 'cache-control': 'no-store' },
      })
    throw error
  }
}
