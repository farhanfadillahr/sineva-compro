import { purgeExpiredLeads } from '@/features/leads/retention.server'
import { isCronRequest } from '@/lib/http/cron-auth'

export const dynamic = 'force-dynamic'

/** Daily retention job (CPR-111, scheduled in vercel.json). Only Vercel Cron may call it. */
export async function GET(request: Request) {
  if (!isCronRequest(request.headers))
    return new Response(null, { status: 401, headers: { 'cache-control': 'no-store' } })
  const leads = await purgeExpiredLeads()
  return Response.json({ leads }, { headers: { 'cache-control': 'no-store' } })
}
