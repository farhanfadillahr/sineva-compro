/**
 * Email template rendering. Placeholder values come from visitors (a lead's name, message), so:
 * - the HTML body escapes every value, and the stored template text itself, before it reaches the
 *   branded layout (no markup from templates or values is ever interpreted);
 * - the subject strips line breaks and control characters, so a value cannot add mail headers.
 */
export const EMAIL_TEMPLATE_KEYS = [
  'lead-notification',
  'lead-auto-reply',
  'waitlist-confirmation',
] as const
export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number]

export const TEMPLATE_PLACEHOLDERS: Record<EmailTemplateKey, readonly string[]> = {
  'lead-notification': [
    'name',
    'email',
    'phone',
    'company',
    'service',
    'segment',
    'message',
    'site',
  ],
  'lead-auto-reply': ['name', 'service', 'site'],
  'waitlist-confirmation': ['email', 'segment', 'site', 'product'],
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => ESCAPES[c])

const PLACEHOLDER = /\{([a-z]+)\}/g

export function unknownPlaceholders(text: string, key: EmailTemplateKey): string[] {
  return [...text.matchAll(PLACEHOLDER)]
    .map((m) => m[1])
    .filter((name) => !TEMPLATE_PLACEHOLDERS[key].includes(name))
}

// Control characters plus the Unicode line and paragraph separators, built from char codes: a
// literal U+2028 in source is itself a line terminator.
const LINE_BREAKS = new RegExp(
  `[\\u0000-\\u001f\\u007f${String.fromCharCode(0x2028)}${String.fromCharCode(0x2029)}]+`,
  'g',
)
const singleLine = (value: string) => value.replace(LINE_BREAKS, ' ').trim()

export function renderSubject(template: string, values: Readonly<Record<string, string>>): string {
  return singleLine(
    template.replace(PLACEHOLDER, (match, name: string) => values[name] ?? match),
  ).slice(0, 200)
}

/** Plain text body: values substituted as text. */
export function renderText(template: string, values: Readonly<Record<string, string>>): string {
  return template.replace(PLACEHOLDER, (match, name: string) => values[name] ?? match)
}

/** HTML body inside the fixed branded layout; everything editable is escaped. */
export function renderHtml(
  template: string,
  values: Readonly<Record<string, string>>,
  brand: { siteName: string },
): string {
  const body = escapeHtml(template)
    .replace(PLACEHOLDER, (match, name: string) =>
      name in values ? escapeHtml(values[name]) : match,
    )
    .split(/\n{2,}/)
    .map((paragraph) => `<p style="margin:0 0 16px">${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('')
  const site = escapeHtml(brand.siteName)
  return `<!doctype html><html><body style="margin:0;background:#f4f7f7;font-family:Arial,Helvetica,sans-serif;color:#10302f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px">
<tr><td style="padding:24px 28px;border-bottom:1px solid #e3ecec;font-weight:700;color:#00757a">${site}</td></tr>
<tr><td style="padding:24px 28px;font-size:15px;line-height:1.6">${body}</td></tr>
<tr><td style="padding:16px 28px;font-size:12px;color:#5a7372">${site}</td></tr>
</table></td></tr></table></body></html>`
}
