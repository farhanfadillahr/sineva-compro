import { suggestDashFix } from '@/lib/copy'
import { buildWhatsAppHref } from '@/lib/whatsapp'

// The static launch has no backend: the waitlist form never posts anywhere. It turns the visitor's
// answers into a message they send themselves, through WhatsApp or their own mail app, so nothing
// leaves the browser until they press "send" in the other app. Pure functions, safe in client and
// server code.
//
// The sanitising below mirrors `lib/contact-message.ts`, which keeps its helpers private. They are
// repeated here rather than imported so the contact module stays untouched.

/** Characters per field, counted in code points. The form sets the same `maxLength`. */
export const WAITLIST_LIMITS = { name: 80, businessType: 60 } as const

export type WaitlistFields = Readonly<{ name: string; businessType: string }>

/** The lines of the message and the mail subject, taken from the messages. */
export type WaitlistMessageCopy = Readonly<{
  notify: string
  name: string
  businessType: string
  emailSubject: string
}>

/**
 * Where a submitted waitlist request can go. `greeting` is the product template of the site
 * settings, so the opening line stays the editable, approved text.
 */
export type WaitlistChannels = Readonly<{
  whatsappNumber: string | null
  /** `null` while no public email is confirmed: the mail route is then off. */
  email: string | null
  greeting: string
}>

// Everything below U+0020 except tab, line feed and carriage return, plus DEL.
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g
// A surrogate half without its partner makes encodeURIComponent throw a URIError.
const LONE_SURROGATE = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g

/**
 * Single-line value. Every run of whitespace, newlines included, becomes one space: that is the
 * defence against a visitor typing "x\nBusiness type: ..." into the name field to forge a line.
 * The dash fix comes before the cut because replacing a dash can change the length, and the cut
 * is by code point so an emoji is never split.
 */
function singleLine(value: string, max: number): string {
  const text = suggestDashFix(
    value.replace(CONTROL, '').replace(LONE_SURROGATE, '').replace(/\s+/g, ' ').trim(),
  )
  const points = Array.from(text)
  return points.length <= max ? text : points.slice(0, max).join('').trimEnd()
}

/** Plain text shared by the WhatsApp and the mail route. */
export function buildWaitlistMessage(
  fields: WaitlistFields,
  copy: WaitlistMessageCopy,
  greeting: string,
): string {
  const name = singleLine(fields.name, WAITLIST_LIMITS.name)
  const businessType = singleLine(fields.businessType, WAITLIST_LIMITS.businessType)
  const details = [
    name ? `${copy.name}: ${name}` : null,
    businessType ? `${copy.businessType}: ${businessType}` : null,
  ].filter((line): line is string => line !== null)
  return [greeting, copy.notify, ...(details.length > 0 ? ['', ...details] : [])].join('\n')
}

/** `https://wa.me/<number>?text=...`, or `null` when the number is unusable. */
export function buildWaitlistWhatsAppUrl(
  fields: WaitlistFields,
  copy: WaitlistMessageCopy,
  channels: WaitlistChannels,
): string | null {
  return buildWhatsAppHref({
    number: channels.whatsappNumber,
    message: buildWaitlistMessage(fields, copy, channels.greeting),
  })
}

// Deliberately plain: no quotes, commas, query or fragment characters. The address goes into a URL
// unencoded, so anything that could add a recipient (`,`), a header (`?cc=`) or end the address
// early must not pass.
const PLAIN_EMAIL = /^[^\s@,;?&#<>"'%]+@[^\s@,;?&#<>"'%]+\.[^\s@,;?&#<>"'%]+$/

/**
 * `mailto:` alternative, `null` while no public email is confirmed. Subject and body go through
 * encodeURIComponent, not URLSearchParams: the latter writes spaces as `+`, which mail apps show
 * literally.
 */
export function buildWaitlistMailto(
  fields: WaitlistFields,
  copy: WaitlistMessageCopy,
  channels: WaitlistChannels,
): string | null {
  const email = channels.email?.trim()
  if (!email || !PLAIN_EMAIL.test(email)) return null
  const body = buildWaitlistMessage(fields, copy, channels.greeting)
  return `mailto:${email}?subject=${encodeURIComponent(copy.emailSubject)}&body=${encodeURIComponent(body)}`
}
