import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './i18n/routing'

// With `localePrefix: 'as-needed'` the middleware must see every public URL: it rewrites the
// unprefixed `/services` to the internal `/en/services` and redirects an explicit `/en/...`
// back to the unprefixed URL. Locale detection and the cookie are off (single locale), so `/`
// is a plain cacheable 200 and Accept-Language is never read. `./i18n/accept-language` is
// intentionally unused for now: it validates the header for detection, which a second locale
// would bring back.
const localize = createMiddleware(routing)

type Env = Readonly<Record<string, string | undefined>>
type Route = 'not-found' | 'pass' | 'localize'

/**
 * The admin and its auth API are reachable only when `ADMIN_ENABLED` allows it. Production
 * defaults to off so a deployment without a CMS (phase 1) never exposes them; development
 * defaults to on. Only the exact strings "true" and "false" are recognised, so a mistyped value
 * falls back to the environment default instead of silently opening the admin in production.
 */
export function isAdminEnabled(env: Env = process.env): boolean {
  if (env.ADMIN_ENABLED === 'true') return true
  if (env.ADMIN_ENABLED === 'false') return false
  return env.NODE_ENV !== 'production'
}

// Next.js decodes the path before it picks a route, so `/%61dmin` reaches the admin page. The
// guard therefore compares a decoded, lowercased, slash-collapsed form. Decoding is done per
// escape (not with decodeURIComponent) so one malformed escape elsewhere in the path cannot make
// the whole decode throw and skip the check.
function comparable(pathname: string): string {
  return pathname
    .replace(/%([0-9a-f]{2})/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .toLowerCase()
    .replace(/\/{2,}/g, '/')
}

const isUnder = (path: string, base: string) => path === base || path.startsWith(`${base}/`)

/**
 * What the proxy does with a path:
 * - `not-found`: the admin or the auth API while the admin is off.
 * - `pass`: admin and API routes that are allowed; they live outside the localized tree.
 * - `localize`: every public page, handled by next-intl.
 */
export function decideRoute(pathname: string, adminEnabled: boolean): Route {
  const path = comparable(pathname)
  const guarded = isUnder(path, '/admin') || isUnder(path, '/api/auth')
  if (guarded) return adminEnabled ? 'pass' : 'not-found'
  if (isUnder(path, '/api')) return 'pass'
  return 'localize'
}

export function proxy(request: NextRequest) {
  const route = decideRoute(request.nextUrl.pathname, isAdminEnabled(process.env))
  // A bare 404 on purpose: rendering the app's not-found page would still reveal that the
  // admin shell exists, and the localized not-found page needs the whole public layout.
  if (route === 'not-found') return new NextResponse(null, { status: 404 })
  if (route === 'pass') return NextResponse.next()
  return localize(request)
}

// Only files that live outside the localized tree and are served straight from public/ (or
// Next.js itself) are excluded: /_next, /brand, /lottie, /mascot (poster, poses and the GLB),
// /draco (self-hosted decoder), /og, and the root files browsers and crawlers request by name.
// Each folder is matched as `name(?:/|$)` so a page whose first segment only starts with the same
// letters (for example `/mascots`) is still localized. `/admin` and `/api` are deliberately NOT
// excluded: they must reach the proxy so the admin flag can answer 404 before anything renders;
// `decideRoute` keeps them out of next-intl.
export const config = {
  matcher: [
    '/((?!_next(?:/|$)|brand(?:/|$)|lottie(?:/|$)|mascot(?:/|$)|draco(?:/|$)|og(?:/|$)|(?:favicon\\.ico|robots\\.txt|sitemap\\.xml)$).*)',
  ],
}
