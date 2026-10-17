import { readServerEnv } from '@/env/server'
import { AccessDeniedError } from '@/features/auth/access-errors'
import { LEAD_STATUS_LABELS, exportLeads, readLeadFilters } from '@/features/leads/admin.server'
import { toCsv } from '@/features/waitlist/csv'

export const dynamic = 'force-dynamic'

/**
 * Admin-only CSV of the leads matching the list filters (CPR-116), Indonesian headers. Never
 * cached, never public. The file holds personal data: the admin guide asks to delete it after use.
 */
export async function GET(request: Request) {
  readServerEnv(process.env)
  const params = Object.fromEntries(new URL(request.url).searchParams)
  try {
    const rows = await exportLeads(request.headers, readLeadFilters(params))
    const csv = toCsv(
      [
        'Nama',
        'Email',
        'WhatsApp',
        'Perusahaan',
        'Jenis bisnis',
        'Kebutuhan',
        'Anggaran',
        'Pesan',
        'Status',
        'Catatan internal',
        'Bahasa',
        'Halaman asal',
        'Persetujuan',
        'Masuk',
      ],
      rows.map((r) => [
        r.name,
        r.email,
        r.phone,
        r.company,
        r.segment,
        r.interest,
        r.budget,
        r.message,
        LEAD_STATUS_LABELS[r.status as keyof typeof LEAD_STATUS_LABELS] ?? r.status,
        r.notes,
        r.locale,
        r.sourcePage,
        r.consentAt.toISOString(),
        r.createdAt.toISOString(),
      ]),
    )
    return new Response(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="lead-${new Date().toISOString().slice(0, 10)}.csv"`,
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
