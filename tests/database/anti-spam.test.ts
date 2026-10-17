import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { createCmsTestContext } from '../helpers/cms-context'
import { lead } from '../../src/features/leads/schema'
import { intakeAttempt } from '../../src/features/leads/attempt-schema'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: () => unknown) => fn,
}))

let ctx: Awaited<ReturnType<typeof createCmsTestContext>>
let intake: typeof import('../../src/features/leads/intake.server')
let hooks: typeof import('../../src/features/leads/hooks.server')

const valid = {
  name: 'Ayu Lestari',
  company: '',
  segment: 'Small business',
  interest: 'AI Build',
  budget: '',
  message: 'We answer the same customer questions every day.',
  consent: true,
  email: 'ayu@example.com',
  whatsapp: '081234567890',
  turnstileToken: 'valid-token',
}
const from = (ip: string) => new Headers({ 'cf-connecting-ip': ip })

beforeAll(async () => {
  ctx = await createCmsTestContext()
  intake = await import('../../src/features/leads/intake.server')
  hooks = await import('../../src/features/leads/hooks.server')
  hooks.setTurnstileVerifierForTests(async (token) => token === 'valid-token')
})
beforeEach(async () => {
  await ctx.connection.db.delete(lead)
  await ctx.connection.db.delete(intakeAttempt)
})
afterAll(async () => {
  if (!ctx) return
  hooks.setTurnstileVerifierForTests(null)
  await ctx.connection.db.delete(lead)
  await ctx.connection.db.delete(intakeAttempt)
  await ctx.cleanup()
})

it('drops a filled honeypot silently but answers with success', async () => {
  const result = await intake.createContactLead(
    { ...valid, website: 'https://spam.example' },
    { headers: from('203.0.113.7') },
  )
  expect(result.ok).toBe(true)
  expect(await ctx.connection.db.select().from(lead)).toHaveLength(0)
})

it('rejects a missing or invalid Turnstile token on the server', async () => {
  for (const turnstileToken of ['', 'forged-token']) {
    const result = await intake.createContactLead(
      { ...valid, turnstileToken },
      { headers: from('203.0.113.8') },
    )
    expect(result).toMatchObject({ ok: false, formError: expect.stringContaining('verify') })
  }
  expect(await ctx.connection.db.select().from(lead)).toHaveLength(0)
})

it('refuses the sixth submission from one client within ten minutes with a friendly message', async () => {
  for (let i = 0; i < 5; i += 1)
    expect((await intake.createContactLead(valid, { headers: from('203.0.113.9') })).ok).toBe(true)
  const sixth = await intake.createContactLead(valid, { headers: from('203.0.113.9') })
  expect(sixth).toMatchObject({
    ok: false,
    formError: expect.stringContaining('Too many messages'),
  })
  expect((await intake.createContactLead(valid, { headers: from('203.0.113.10') })).ok).toBe(true)
  expect(await ctx.connection.db.select().from(lead)).toHaveLength(6)
  const attempts = await ctx.connection.db.select().from(intakeAttempt)
  expect(JSON.stringify(attempts)).not.toContain('203.0.113.9')
})
