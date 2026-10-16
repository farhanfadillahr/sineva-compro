/**
 * Receives CSP violation reports (report-only on previews, CPR-53). Logs one compact line per
 * report with the directive and blocked origin only; page paths and query strings are dropped.
 */
export async function POST(request: Request) {
  try {
    const text = (await request.text()).slice(0, 10_000)
    const body = JSON.parse(text) as { 'csp-report'?: Record<string, string> }
    const report = body['csp-report'] ?? {}
    const blocked = report['blocked-uri'] ?? ''
    let blockedOrigin = blocked
    try {
      blockedOrigin = new URL(blocked).origin
    } catch {
      blockedOrigin = blocked.split(':')[0]
    }
    console.warn(
      `[csp] ${report['effective-directive'] ?? report['violated-directive'] ?? 'unknown'} blocked ${blockedOrigin.slice(0, 120)}`,
    )
  } catch {
    // Malformed reports are ignored.
  }
  return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } })
}
