import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { hasLocale } from 'next-intl'
import { routing } from './i18n/routing'
import { normalizeAcceptLanguage } from './i18n/accept-language'

const localize = createMiddleware(routing)
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  // Only the entry point and explicit supported locales participate in negotiation.
  if (pathname !== '/' && !hasLocale(routing.locales, pathname.split('/')[1])) {
    return NextResponse.next()
  }
  // Invalid weights must not become permissive library matches; cookie/URL still win.
  request.headers.set(
    'accept-language',
    normalizeAcceptLanguage(request.headers.get('accept-language')),
  )
  const response = localize(request)
  if (pathname === '/') {
    response.headers.set('Cache-Control', 'private, no-store')
    const vary = new Set(
      (response.headers.get('Vary') ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    )
    vary.add('Cookie')
    vary.add('Accept-Language')
    response.headers.set('Vary', [...vary].join(', '))
  }
  return response
}
export const config = {
  matcher: ['/((?!admin(?:/|$)|api(?:/|$)|_next(?:/|$)|brand(?:/|$)).*)'],
}
