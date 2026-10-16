import createMiddleware from 'next-intl/middleware'
import type { NextRequest } from 'next/server'
import { routing } from './i18n/routing'

// With `localePrefix: 'as-needed'` the middleware must see every public URL: it rewrites the
// unprefixed `/services` to the internal `/en/services` and redirects an explicit `/en/...`
// back to the unprefixed URL. Locale detection and the cookie are off (single locale), so `/`
// is a plain cacheable 200 and Accept-Language is never read. `./i18n/accept-language` is
// intentionally unused for now: it validates the header for detection, which a second locale
// would bring back.
const localize = createMiddleware(routing)
export function proxy(request: NextRequest) {
  return localize(request)
}
// Static files that live outside the localized tree must be excluded here, otherwise they
// would be rewritten to `/en/...` and 404: /admin, /api, /_next, /brand, /lottie, /mascot
// (poster, poses and the GLB), /draco (self-hosted decoder) and /og (public/) and the root files
// browsers and crawlers request by name. Each folder is matched as `name(?:/|$)` so a page whose
// first segment only starts with the same letters (for example `/mascots`) is still localized.
export const config = {
  matcher: [
    '/((?!admin(?:/|$)|api(?:/|$)|_next(?:/|$)|brand(?:/|$)|lottie(?:/|$)|mascot(?:/|$)|draco(?:/|$)|og(?:/|$)|(?:favicon\\.ico|robots\\.txt|sitemap\\.xml)$).*)',
  ],
}
