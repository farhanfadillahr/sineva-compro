import type { SiteSettingsDTO } from '../features/content/types'

// Pure and free of server-only/DOM APIs so the header, the floating button and the mobile bar
// (client components) and any server page can share one builder.

export type WhatsAppSettings = SiteSettingsDTO['whatsapp']
export type WhatsAppTemplates = WhatsAppSettings['templates']

/**
 * Which template a button should open the chat with (docs/design/copywriting.md section 6).
 * `name` is the service title, used for the `{service name}` placeholder some templates carry.
 */
export type WhatsAppContext =
  | { kind: 'general' }
  | { kind: 'product' }
  | { kind: 'thankYou' }
  | { kind: 'service'; slug: string; name?: string }

const SERVICE_NAME_PLACEHOLDER = '{service name}'

/**
 * E.164 allows at most 15 digits and the first one after the country code prefix is never 0.
 * The lower bound of 7 digits only rejects obvious typos; it is not a per-country check.
 */
const E164 = /^\+[1-9]\d{6,14}$/

/**
 * Returns the digits wa.me expects (E.164 without the plus), or `null` when the value is not a
 * usable international number. A leading `+` is required on purpose: a national number such as
 * `0812...` has no country code, and wa.me would open the wrong chat or fail. Separators that
 * editors type into a settings field (spaces, hyphens, dots, parentheses) are ignored.
 */
export function normalizeWhatsAppNumber(value: string | null | undefined): string | null {
  if (!value) return null
  const compact = value.trim().replace(/[\s().-]/g, '')
  return E164.test(compact) ? compact.slice(1) : null
}

/** `null` when the number is unusable, so callers render no button instead of a dead link. */
export function buildWhatsAppHref(input: {
  number: string | null | undefined
  message?: string | null
}): string | null {
  const digits = normalizeWhatsAppNumber(input.number)
  if (!digits) return null
  const message = input.message?.trim()
  const base = `https://wa.me/${digits}`
  // encodeURIComponent, not encodeURI: `&`, `=`, `#` and `?` inside the message would otherwise
  // end or corrupt the query string.
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

export function resolveWhatsAppMessage(
  templates: WhatsAppTemplates,
  context: WhatsAppContext = { kind: 'general' },
): string {
  switch (context.kind) {
    case 'product':
      return templates.product
    case 'thankYou':
      return templates.thankYou
    case 'service': {
      const entry = templates.services.find((item) => item.serviceSlug === context.slug)
      if (!entry) return templates.general
      if (!entry.message.includes(SERVICE_NAME_PLACEHOLDER)) return entry.message
      // A placeholder we cannot fill would reach the visitor as literal braces; the general
      // message is a safe, correct fallback.
      return context.name
        ? entry.message.replaceAll(SERVICE_NAME_PLACEHOLDER, context.name)
        : templates.general
    }
    default:
      return templates.general
  }
}

export function whatsappHrefFor(
  settings: WhatsAppSettings | null | undefined,
  context: WhatsAppContext = { kind: 'general' },
): string | null {
  if (!settings) return null
  return buildWhatsAppHref({
    number: settings.number,
    message: resolveWhatsAppMessage(settings.templates, context),
  })
}

/**
 * Maps an internal (locale-less) pathname to a context. Paths come from the English table in
 * src/i18n/routing.ts; `useInternalPathname` returns these internal paths with params filled in
 * for every locale, so this function needs no per-locale table.
 */
export function whatsappContextFromPathname(pathname: string | null | undefined): WhatsAppContext {
  if (!pathname) return { kind: 'general' }
  if (pathname === '/products/ai-agents' || pathname.startsWith('/products/ai-agents/')) {
    return { kind: 'product' }
  }
  if (pathname === '/contact/thank-you') return { kind: 'thankYou' }
  const service = /^\/services\/([^/]+)\/?$/.exec(pathname)
  if (service) return { kind: 'service', slug: service[1] }
  return { kind: 'general' }
}
