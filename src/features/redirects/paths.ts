/**
 * Pure redirect rules shared by the admin, the slug-change hook and the proxy.
 */
export const MAX_CHAIN = 5

/** Normalises a public path: one leading slash, no trailing slash, no query or fragment. */
export function normalizePath(input: string): string | null {
  const value = input.trim()
  if (!/^\/(?!\/)[A-Za-z0-9\-._~/%]*$/.test(value)) return null
  const collapsed = value.replace(/\/{2,}/g, '/')
  const trimmed = collapsed.length > 1 ? collapsed.replace(/\/+$/, '') : collapsed
  return trimmed.length <= 300 ? trimmed : null
}

/** Paths a redirect may never start from: the admin, the APIs and Next internals. */
export function isReservedPath(path: string): boolean {
  const lower = path.toLowerCase()
  return ['/admin', '/api', '/_next'].some((base) => lower === base || lower.startsWith(`${base}/`))
}

export type RedirectRule = { fromPath: string; toPath: string; status: number }

/**
 * Validates a new rule against the existing ones: no loop, and no chain longer than `MAX_CHAIN`
 * hops starting from the new rule. Returns an Indonesian message or `null`.
 */
export function chainProblem(rule: RedirectRule, existing: readonly RedirectRule[]): string | null {
  const map = new Map(
    existing.filter((r) => r.fromPath !== rule.fromPath).map((r) => [r.fromPath, r.toPath]),
  )
  map.set(rule.fromPath, rule.toPath)
  const seen = new Set<string>([rule.fromPath])
  let current = rule.toPath
  for (let hops = 1; map.has(current); hops += 1) {
    if (seen.has(current)) return 'Redirect ini membuat putaran (loop). Periksa tujuan redirect.'
    if (hops >= MAX_CHAIN)
      return `Rantai redirect lebih dari ${MAX_CHAIN} langkah. Arahkan langsung ke tujuan akhir.`
    seen.add(current)
    current = map.get(current)!
  }
  return seen.has(current) ? 'Redirect ini membuat putaran (loop). Periksa tujuan redirect.' : null
}
