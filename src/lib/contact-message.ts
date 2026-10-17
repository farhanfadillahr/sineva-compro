import type { SiteSettingsDTO } from '../features/content/types'
import { suggestDashFix } from './copy'
import { buildWhatsAppHref, resolveWhatsAppMessage, type WhatsAppTemplates } from './whatsapp'

// The static launch has no backend: the contact form never posts anywhere. It turns the visitor's
// answers into a message they send themselves, through WhatsApp or their own mail app. Nothing
// here touches the network or storage, so no personal data leaves the browser until the visitor
// presses "send" in the other app. Pure functions, safe in client and server code.

export const CONTACT_SEGMENTS = ['Small business', 'Company', 'Startup', 'Other'] as const
export type ContactSegment = (typeof CONTACT_SEGMENTS)[number]

export const CONTACT_INTERESTS = [
  'AI Discovery',
  'AI Build',
  'AI Enablement',
  'Sineva Product Suite',
  'Not sure yet',
] as const
export type ContactInterest = (typeof CONTACT_INTERESTS)[number]

export type ContactFields = Readonly<{
  name: string
  company?: string
  segment: ContactSegment
  interest: ContactInterest
  budget?: string
  message: string
}>

/**
 * Maximum characters per field, counted in code points. The form should set the same values as
 * `maxLength`; the builder cuts anyway so a pasted or scripted value cannot build an oversized
 * link. Percent-encoding can triple the URL length (emoji: about twelve times), and chat apps
 * and mail clients cap URLs, so the message limit is the one that matters most.
 */
export const CONTACT_LIMITS = { name: 80, company: 120, budget: 60, message: 1000 } as const

/** Which template opens each interest. `Sineva Product Suite` and services follow settings. */
const SERVICE_SLUG: Partial<Record<ContactInterest, string>> = {
  'AI Discovery': 'ai-discovery',
  'AI Build': 'ai-build',
  'AI Enablement': 'ai-enablement',
}

// Everything below U+0020 except tab, line feed and carriage return, plus DEL. Control characters
// have no place in a chat message and some terminals and mail clients act on them.
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g
// A surrogate half without its partner makes encodeURIComponent throw a URIError.
const LONE_SURROGATE = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g

/** Code point aware cut, so an emoji is never split into two broken halves. */
function limit(text: string, max: number): string {
  const points = Array.from(text)
  return points.length <= max ? text : points.slice(0, max).join('').trimEnd()
}

function base(text: string): string {
  return text.replace(CONTROL, '').replace(LONE_SURROGATE, '')
}

/**
 * Single-line field. Every run of whitespace, newlines included, becomes one space. That is the
 * defence against a visitor typing "x\nBudget: ..." into the name field to forge another line.
 * The dash fix comes before the length cut because replacing a dash can change the length.
 */
function singleLine(value: string | undefined, max: number): string {
  return limit(
    suggestDashFix(
      base(value ?? '')
        .replace(/\s+/g, ' ')
        .trim(),
    ),
    max,
  )
}

/** Multi-line field: keeps paragraph breaks, drops trailing spaces and runs of blank lines. */
function multiLine(value: string | undefined, max: number): string {
  const lines = base(value ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
  return limit(
    suggestDashFix(
      lines
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim(),
    ),
    max,
  )
}

const isSegment = (value: string): value is ContactSegment =>
  (CONTACT_SEGMENTS as readonly string[]).includes(value)
const isInterest = (value: string): value is ContactInterest =>
  (CONTACT_INTERESTS as readonly string[]).includes(value)

type Cleaned = Readonly<{
  name: string
  company: string
  segment: ContactSegment
  interest: ContactInterest
  budget: string
  message: string
}>

/** `null` when the fields cannot make a sendable message. The form validates first. */
function clean(fields: ContactFields): Cleaned | null {
  const name = singleLine(fields.name, CONTACT_LIMITS.name)
  const message = multiLine(fields.message, CONTACT_LIMITS.message)
  if (!name || !message) return null
  if (!isSegment(fields.segment) || !isInterest(fields.interest)) return null
  return {
    name,
    company: singleLine(fields.company, CONTACT_LIMITS.company),
    segment: fields.segment,
    interest: fields.interest,
    budget: singleLine(fields.budget, CONTACT_LIMITS.budget),
    message,
  }
}

function greetingFor(interest: ContactInterest, templates: WhatsAppTemplates): string {
  const slug = SERVICE_SLUG[interest]
  if (slug) return resolveWhatsAppMessage(templates, { kind: 'service', slug, name: interest })
  if (interest === 'Sineva Product Suite')
    return resolveWhatsAppMessage(templates, { kind: 'product' })
  return resolveWhatsAppMessage(templates, { kind: 'general' })
}

function compose(cleaned: Cleaned, templates: WhatsAppTemplates): string {
  return [
    // The opening line comes from the editable templates so it stays in the Founder-approved voice
    // and matches what the WhatsApp buttons elsewhere on the site open with.
    greetingFor(cleaned.interest, templates),
    '',
    `Name: ${cleaned.name}`,
    cleaned.company ? `Company: ${cleaned.company}` : null,
    `Business type: ${cleaned.segment}`,
    `Interested in: ${cleaned.interest}`,
    cleaned.budget ? `Budget: ${cleaned.budget}` : null,
    `Message: ${cleaned.message}`,
  ]
    .filter((line): line is string => line !== null)
    .join('\n')
}

/** The plain-text message shared by the WhatsApp and email routes. `null` when not sendable. */
export function buildContactMessage(
  fields: ContactFields,
  templates: WhatsAppTemplates,
): string | null {
  const cleaned = clean(fields)
  return cleaned ? compose(cleaned, templates) : null
}

/** `https://wa.me/<number>?text=...`, or `null` when the fields or the number are unusable. */
export function buildContactWhatsAppUrl(
  fields: ContactFields,
  settings: Pick<SiteSettingsDTO, 'whatsapp'>,
): string | null {
  const message = buildContactMessage(fields, settings.whatsapp.templates)
  if (!message) return null
  return buildWhatsAppHref({ number: settings.whatsapp.number, message })
}

// Deliberately plain: no quotes, commas, query or fragment characters. The address is dropped into
// a URL unencoded, so anything that could add a recipient (`,`), a header (`?cc=`) or end the
// address early must not pass.
const PLAIN_EMAIL = /^[^\s@,;?&#<>"'%]+@[^\s@,;?&#<>"'%]+\.[^\s@,;?&#<>"'%]+$/

/**
 * `mailto:` alternative, `null` while no public email is confirmed (`contact.email` is `null`).
 * Subject and body go through encodeURIComponent, not URLSearchParams: the latter writes spaces
 * as `+`, which mail apps show literally.
 */
export function buildContactMailto(
  fields: ContactFields,
  settings: Pick<SiteSettingsDTO, 'contact' | 'whatsapp'>,
): string | null {
  const email = settings.contact.email?.trim()
  if (!email || !PLAIN_EMAIL.test(email)) return null
  const cleaned = clean(fields)
  if (!cleaned) return null
  const subject = `Enquiry from ${cleaned.name}: ${cleaned.interest}`
  const body = compose(cleaned, settings.whatsapp.templates)
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
