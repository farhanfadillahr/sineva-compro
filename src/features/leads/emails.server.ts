import 'server-only'
import { eq } from 'drizzle-orm'
import { routing } from '../../i18n/routing'
import { db } from '../../lib/db/client.server'
import { reportError } from '../../lib/observability/report'
import { resolveEmailConfig } from '../email/config.server'
import { renderTemplate } from '../email/service.server'
import { renderHtml } from '../email/render'
import { emailIsDelivered, sendEmail, type SendResult } from '../email/transport.server'
import { readStoredSettings, defaultSettings } from '../settings/service.server'
import { waitlist } from '../waitlist/schema'
import { lead, type LeadEmailResult, type LeadEmailStatus } from './schema'

async function siteContext() {
  const stored = await readStoredSettings(db, [routing.defaultLocale])
  const global = stored.global ?? defaultSettings().global
  return {
    siteName: global.brand.siteName,
    productName: global.brand.productName,
    routing: global.leadRouting,
  }
}

/**
 * Lead emails (CPR-50): an internal notification to every lead inbox (reply-to: the prospect) and
 * an auto-reply to the prospect in the lead's locale. Templates come from the admin (CPR-86) or the
 * code default; values are escaped. Any failure is reported without personal data and never
 * touches the stored lead.
 */
export async function sendLeadEmails(id: string): Promise<void> {
  try {
    const [row] = await db.select().from(lead).where(eq(lead.id, id))
    if (!row) return
    const [config, site] = await Promise.all([resolveEmailConfig(), siteContext()])
    const values = {
      name: row.name,
      email: row.email,
      phone: `+${row.phone}`,
      company: row.company ?? '-',
      service: row.interest,
      segment: row.segment,
      message: row.message,
      site: site.siteName,
    }
    const brand = { siteName: site.siteName }
    const notification = await renderTemplate('lead-notification', row.locale, values, brand)
    const notices: SendResult[] = []
    for (const to of site.routing.inboxEmails) {
      const result = await sendEmail(config, { to, ...notification, replyTo: row.email })
      notices.push(result)
      if (!result.ok) reportError('Lead notification failed', { area: 'email', reference: id })
    }
    const reply = await renderTemplate('lead-auto-reply', row.locale, values, brand)
    const result = await sendEmail(config, {
      to: row.email,
      ...reply,
      replyTo: config.from.replyTo,
    })
    if (!result.ok) reportError('Lead auto-reply failed', { area: 'email', reference: id })
    await recordEmailStatus(id, {
      notification: notices.length
        ? combined(notices)
        : outcome('skipped', 'Inbox lead belum diatur di Pengaturan situs.'),
      autoReply: fromResult(result),
    })
  } catch (error) {
    reportError('Lead emails failed', { area: 'email', reference: id }, error)
    const failed = outcome('failed', 'Pengiriman berhenti karena galat; lihat log server.')
    await recordEmailStatus(id, { notification: failed, autoReply: failed }).catch(() => {})
  }
}

// Delivery outcome per lead (CPR-112), shown on the lead page. Details come from the transport,
// which already strips the secret; they are capped so a long provider error cannot bloat the row.
const outcome = (status: LeadEmailResult['status'], detail: string): LeadEmailResult => ({
  status,
  at: new Date().toISOString(),
  detail: detail.slice(0, 300),
})
const fromResult = (result: SendResult): LeadEmailResult =>
  !result.ok
    ? outcome('failed', result.detail)
    : outcome(emailIsDelivered() ? 'sent' : 'mock', result.detail)
/** One notification goes to every inbox: it counts as failed when any of them failed. */
function combined(results: SendResult[]): LeadEmailResult {
  const failed = results.filter((r) => !r.ok)
  if (!failed.length) return fromResult(results[0])
  return outcome(
    'failed',
    `${failed.length} dari ${results.length} inbox gagal: ${failed[0].detail}`,
  )
}
async function recordEmailStatus(id: string, status: LeadEmailStatus) {
  await db.update(lead).set({ emailStatus: status }).where(eq(lead.id, id))
}

/** Internal notice of a new waitlist signup, when enabled in Site settings (CPR-48). */
export async function sendWaitlistNotice(id: string): Promise<void> {
  try {
    const site = await siteContext()
    if (!site.routing.waitlistNotifications || !site.routing.inboxEmails.length) return
    const [row] = await db.select().from(waitlist).where(eq(waitlist.id, id))
    if (!row) return
    const config = await resolveEmailConfig()
    const text = `Pendaftar baru di waitlist ${site.productName}.\n\nEmail: ${row.email}\nJenis bisnis: ${row.segment ?? '-'}`
    for (const to of site.routing.inboxEmails) {
      const result = await sendEmail(config, {
        to,
        subject: `Waitlist ${site.productName}: pendaftar baru`,
        html: renderHtml(text, {}, { siteName: site.siteName }),
        text,
      })
      if (!result.ok) reportError('Waitlist notice failed', { area: 'email', reference: id })
    }
  } catch (error) {
    reportError('Waitlist notice failed', { area: 'email', reference: id }, error)
  }
}
