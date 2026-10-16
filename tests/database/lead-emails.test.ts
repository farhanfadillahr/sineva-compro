import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { createCmsTestContext } from '../helpers/cms-context'
import { lead } from '../../src/features/leads/schema'
import { intakeAttempt } from '../../src/features/leads/attempt-schema'
import { siteSettings, siteSettingsTranslation } from '../../src/features/settings/schema'
import { emailSettings, emailTemplate } from '../../src/features/email/schema'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: () => unknown) => fn,
}))

let ctx: Awaited<ReturnType<typeof createCmsTestContext>>
let emails: typeof import('../../src/features/leads/emails.server')
let transport: typeof import('../../src/features/email/transport.server')
let report: typeof import('../../src/lib/observability/report')

const submission = {
  name: 'Eve <b>Bold</b>\r\nBcc: victim@example.com',
  company: '',
  segment: 'Startup',
  interest: 'AI Build',
  budget: '',
  message: '<script>alert(1)</script> We need help with customer chats.',
  consent: true,
  email: 'eve@example.com',
  whatsapp: '081234567890',
  turnstileToken: 'valid-token',
}

beforeAll(async () => {
  process.env.EMAIL_DELIVERY = 'mock'
  ctx = await createCmsTestContext()
  emails = await import('../../src/features/leads/emails.server')
  transport = await import('../../src/features/email/transport.server')
  report = await import('../../src/lib/observability/report')
  await ctx.connection.db.delete(emailSettings)
  await ctx.connection.db.delete(emailTemplate)
  await ctx.connection.db.delete(siteSettingsTranslation)
  await ctx.connection.db.delete(siteSettings)
  const { settingsFromDto } = await import('../../src/features/settings/project')
  const { staticContent } = await import('../../src/content/static/source')
  const { global, local } = settingsFromDto(staticContent.siteSettings, {
    inboxEmails: ['inbox@sineva.test'],
  })
  await ctx.connection.db.insert(siteSettings).values({ id: 'site', data: global })
  await ctx.connection.db.insert(siteSettingsTranslation).values({ locale: 'en', data: local })
})
beforeEach(async () => {
  transport.mockOutbox.length = 0
  transport.setEmailTransportForTests(null)
  report.setErrorReporter(null)
  await ctx.connection.db.delete(lead)
  await ctx.connection.db.delete(intakeAttempt)
})
afterAll(async () => {
  if (!ctx) return
  await ctx.connection.db.delete(lead)
  await ctx.connection.db.delete(siteSettingsTranslation)
  await ctx.connection.db.delete(siteSettings)
  await ctx.cleanup()
})

/** Stores the lead directly, so only the explicit `sendLeadEmails` call below sends email. */
async function storedLead() {
  const { cleanLead, readContactSubmission } = await import('../../src/lib/leads/contact-schema')
  const [row] = await ctx.connection.db
    .insert(lead)
    .values({
      ...cleanLead(readContactSubmission(submission)),
      consentAt: new Date(),
      locale: 'en',
      sourcePage: '/contact',
    })
    .returning({ id: lead.id })
  return row.id
}

it('sends the notification to the inbox and the auto-reply to the prospect, safely', async () => {
  const id = await storedLead()
  await emails.sendLeadEmails(id)
  const [notification, reply] = transport.mockOutbox
  expect(notification).toMatchObject({ to: 'inbox@sineva.test', replyTo: 'eve@example.com' })
  expect(notification.subject).toBe('New lead from Eve <b>Bold</b> Bcc: victim@example.com')
  expect(notification.subject).not.toMatch(/[\r\n]/)
  expect(notification.html).not.toContain('<script>')
  expect(notification.html).not.toContain('<b>Bold</b>')
  expect(notification.text).toContain('We need help with customer chats.')
  expect(reply).toMatchObject({ to: 'eve@example.com' })
  expect(reply.subject).toContain('Thanks for reaching out')
  expect(reply.html).toContain('Sineva')
})

it('uses a stored template when one exists', async () => {
  await ctx.connection.db.insert(emailTemplate).values({
    key: 'lead-auto-reply',
    locale: 'en',
    subject: 'Hello {name}',
    body: 'Custom reply for {service}.',
  })
  const id = await storedLead()
  await emails.sendLeadEmails(id)
  expect(transport.mockOutbox[1].text).toBe('Custom reply for AI Build.')
  await ctx.connection.db.delete(emailTemplate)
})

it('keeps the lead and reports failures without personal data', async () => {
  const reports: string[] = []
  report.setErrorReporter((category, context, name) =>
    reports.push(`${category}|${context.reference}|${name}`),
  )
  transport.setEmailTransportForTests(async () => {
    throw new Error('SMTP refused eve@example.com')
  })
  const id = await storedLead()
  await emails.sendLeadEmails(id)
  expect(await ctx.connection.db.select().from(lead).where(eq(lead.id, id))).toHaveLength(1)
  expect(reports).toHaveLength(1)
  expect(reports.join(' ')).not.toMatch(/eve@example\.com|Eve/)
})
