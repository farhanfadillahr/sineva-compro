import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { eq, sql } from 'drizzle-orm'
import { createCmsTestContext } from '../helpers/cms-context'
import { lead } from '../../src/features/leads/schema'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: () => unknown) => fn,
}))
vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw Object.assign(new Error('NEXT_REDIRECT'), { path })
  },
}))
vi.mock('next/headers', () => ({ headers: async () => new Headers() }))

let ctx: Awaited<ReturnType<typeof createCmsTestContext>>
let intake: typeof import('../../src/features/leads/intake.server')
let actions: typeof import('../../src/features/leads/actions')

const valid = {
  name: 'Ayu Lestari',
  company: 'Toko Ayu',
  segment: 'Small business',
  interest: 'AI Build',
  budget: 'notSure',
  message: 'We answer the same customer questions every day.',
  consent: true,
  email: 'Ayu@Example.com',
  whatsapp: '+62 812 3456 7890',
  turnstileToken: 'valid-token',
}

beforeAll(async () => {
  ctx = await createCmsTestContext()
  intake = await import('../../src/features/leads/intake.server')
  actions = await import('../../src/features/leads/actions')
  const hooks = await import('../../src/features/leads/hooks.server')
  hooks.setTurnstileVerifierForTests(async (token) => token === 'valid-token')
  await ctx.connection.db.delete(lead)
})
afterAll(async () => {
  if (!ctx) return
  await ctx.connection.db.delete(lead)
  await ctx.cleanup()
})

it('stores a valid lead as new with locale and source page, then redirects', async () => {
  await expect(
    actions.submitContact(
      { ...valid, status: 'won', notes: 'injected' },
      { sourcePage: '/services/ai-build' },
    ),
  ).rejects.toMatchObject({ path: '/contact/thank-you' })
  const [row] = await ctx.connection.db.select().from(lead)
  expect(row).toMatchObject({
    status: 'new',
    notes: '',
    locale: 'en',
    sourcePage: '/services/ai-build',
    email: 'ayu@example.com',
    phone: '6281234567890',
  })
})

it('rejects invalid input on the server even without client validation', async () => {
  const result = await actions.submitContact({ ...valid, email: 'nope', consent: false })
  expect(result.ok).toBe(false)
  expect(Object.keys(result.errors).sort()).toEqual(['consent', 'email'])
  expect(result.values.name).toBe('Ayu Lestari')
})

it('returns the values and stores nothing when saving fails', async () => {
  const before = (await ctx.connection.db.select().from(lead)).length
  await ctx.connection.db.execute(
    sql`ALTER TABLE lead ADD CONSTRAINT test_block CHECK (name <> 'Fail Me')`,
  )
  try {
    const result = await intake.createContactLead(
      { ...valid, name: 'Fail Me' },
      { headers: new Headers() },
    )
    expect(result).toMatchObject({ ok: false, formError: expect.stringContaining('WhatsApp') })
    if (!result.ok) expect(result.values.name).toBe('Fail Me')
  } finally {
    await ctx.connection.db.execute(sql`ALTER TABLE lead DROP CONSTRAINT test_block`)
  }
  expect(await ctx.connection.db.select().from(lead)).toHaveLength(before)
  expect(await ctx.connection.db.select().from(lead).where(eq(lead.name, 'Fail Me'))).toHaveLength(
    0,
  )
})
