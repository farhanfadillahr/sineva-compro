import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { createCmsTestContext } from '../helpers/cms-context'
import { emailSettings, emailTemplate } from '../../src/features/email/schema'
import { auditLog } from '../../src/features/audit/schema'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: () => unknown) => fn,
}))

let ctx: Awaited<ReturnType<typeof createCmsTestContext>>
let email: typeof import('../../src/features/email/service.server')
let transport: typeof import('../../src/features/email/transport.server')
const KEY = 'cd'.repeat(32)

const input = (extra: Record<string, unknown> = {}) => ({
  mode: 'resend-api',
  smtpHost: '',
  smtpPort: 587,
  smtpSecurity: 'starttls',
  smtpUsername: '',
  fromName: 'Sineva',
  fromEmail: 'hello@sineva.test',
  replyTo: '',
  secret: '',
  clearSecret: false,
  templates: {},
  ...extra,
})

beforeAll(async () => {
  ctx = await createCmsTestContext()
  process.env.SETTINGS_ENCRYPTION_KEY = KEY
  delete process.env.RESEND_API_KEY
  email = await import('../../src/features/email/service.server')
  transport = await import('../../src/features/email/transport.server')
  await ctx.connection.db.delete(emailSettings)
  await ctx.connection.db.delete(emailTemplate)
})
afterEach(() => {
  process.env.SETTINGS_ENCRYPTION_KEY = KEY
  delete process.env.RESEND_API_KEY
  transport.setEmailTransportForTests(null)
})
afterAll(async () => {
  if (!ctx) return
  await ctx.connection.db.delete(emailSettings)
  await ctx.connection.db.delete(auditLog).where(eq(auditLog.entity, 'email_settings'))
  await ctx.cleanup()
})

it('lets only Admins read or change email settings', async () => {
  await expect(email.loadEmailSettings(ctx.editorHeaders)).rejects.toThrow()
  await expect(email.loadEmailSettings(ctx.anonymous)).rejects.toThrow()
  await expect(email.saveEmailSettings(ctx.editorHeaders, input())).rejects.toThrow()
  await expect(email.sendTestEmail(ctx.editorHeaders)).rejects.toThrow()
})

it('stores the secret encrypted, never returns or audits it', async () => {
  await email.saveEmailSettings(ctx.adminHeaders, input({ secret: 're_super_secret_123' }))
  const [row] = await ctx.connection.db.select().from(emailSettings)
  expect(row.secret).toMatch(/^v1:/)
  expect(row.secret).not.toContain('re_super_secret_123')
  const view = await email.loadEmailSettings(ctx.adminHeaders)
  expect(view.hasSecret).toBe(true)
  expect(JSON.stringify(view)).not.toContain('re_super_secret_123')
  const entries = await ctx.connection.db
    .select()
    .from(auditLog)
    .where(eq(auditLog.entity, 'email_settings'))
  expect(JSON.stringify(entries)).not.toContain('re_super_secret_123')
  expect(entries.flatMap((e) => e.changedFields)).toContain('apiKey')
})

it('fails safe without SETTINGS_ENCRYPTION_KEY', async () => {
  delete process.env.SETTINGS_ENCRYPTION_KEY
  await expect(
    email.saveEmailSettings(ctx.adminHeaders, input({ secret: 'another-secret-value' })),
  ).rejects.toMatchObject({ code: 'INVALID' })
  const [row] = await ctx.connection.db.select().from(emailSettings)
  expect(row.secret).not.toContain('another-secret-value')
  const result = await email.sendTestEmail(ctx.adminHeaders)
  expect(result.ok).toBe(false)
})

it('sends a test email through a mock provider, preferring environment values', async () => {
  const sent: unknown[] = []
  transport.setEmailTransportForTests(async (config, message) => {
    sent.push({ secret: config.secret, managed: config.managedByEnvironment, to: message.to })
    return { ok: true, provider: config.mode, detail: 'Terkirim, id test-1' }
  })
  expect(await email.sendTestEmail(ctx.adminHeaders)).toEqual({
    ok: true,
    provider: 'resend-api',
    detail: 'Terkirim, id test-1',
  })
  expect(sent[0]).toMatchObject({ secret: 're_super_secret_123', managed: false })
  process.env.RESEND_API_KEY = 're_from_environment'
  expect((await email.loadEmailSettings(ctx.adminHeaders)).managedByEnvironment).toBe('resend-api')
  await email.sendTestEmail(ctx.adminHeaders)
  expect(sent[1]).toMatchObject({ secret: 're_from_environment', managed: true })
})

it('rejects unknown template placeholders and multi-line subjects', async () => {
  await expect(
    email.saveEmailSettings(
      ctx.adminHeaders,
      input({
        templates: { en: { 'lead-auto-reply': { subject: 'Hi\nBcc: x', body: 'Hello {price}' } } },
      }),
    ),
  ).rejects.toMatchObject({ code: 'INVALID' })
})
