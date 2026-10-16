import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { sql } from 'drizzle-orm'
import { createCmsTestContext } from '../helpers/cms-context'
import { waitlist } from '../../src/features/waitlist/schema'
import { intakeAttempt } from '../../src/features/leads/attempt-schema'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: () => unknown) => fn,
}))

let ctx: Awaited<ReturnType<typeof createCmsTestContext>>
let service: typeof import('../../src/features/waitlist/service.server')
let route: typeof import('../../src/app/(admin)/admin/(protected)/waitlist/export/route')

const join = (email: string, ip: string) =>
  service.joinWaitlistEntry(
    { email, consent: true, turnstileToken: 'valid-token' },
    { headers: new Headers({ 'cf-connecting-ip': ip }) },
  )

beforeAll(async () => {
  ctx = await createCmsTestContext()
  service = await import('../../src/features/waitlist/service.server')
  route = await import('../../src/app/(admin)/admin/(protected)/waitlist/export/route')
  const hooks = await import('../../src/features/leads/hooks.server')
  hooks.setTurnstileVerifierForTests(async (token) => token === 'valid-token')
})
beforeEach(async () => {
  await ctx.connection.db.delete(waitlist)
  await ctx.connection.db.delete(intakeAttempt)
})
afterAll(async () => {
  if (!ctx) return
  await ctx.connection.db.delete(waitlist)
  await ctx.cleanup()
})

it('stores one row and answers identically for repeated and concurrent signups', async () => {
  const first = await join('Ayu@Example.com', '198.51.100.1')
  const second = await join('ayu@example.com ', '198.51.100.2')
  const concurrent = await Promise.all([
    join('budi@example.com', '198.51.100.3'),
    join('BUDI@example.com', '198.51.100.4'),
  ])
  expect([first, second, ...concurrent]).toEqual([
    { ok: true },
    { ok: true },
    { ok: true },
    { ok: true },
  ])
  expect(await ctx.connection.db.select().from(waitlist)).toHaveLength(2)
})

it('reports a non-duplicate database failure instead of success', async () => {
  await ctx.connection.db.execute(
    sql`ALTER TABLE waitlist ADD CONSTRAINT test_block CHECK (email <> 'fail@example.com')`,
  )
  try {
    expect(await join('fail@example.com', '198.51.100.5')).toMatchObject({
      ok: false,
      formError: expect.any(String),
    })
  } finally {
    await ctx.connection.db.execute(sql`ALTER TABLE waitlist DROP CONSTRAINT test_block`)
  }
})

it('serves the list and an uncached CSV to Admins only', async () => {
  await join('=cmd@example.com', '198.51.100.6')
  const filters = service.readWaitlistFilters({})
  await expect(service.listWaitlist(ctx.editorHeaders, filters)).rejects.toThrow()
  expect((await service.listWaitlist(ctx.adminHeaders, filters)).total).toBe(1)
  const request = (headers: Headers) =>
    new Request('http://local/admin/waitlist/export', { headers })
  expect((await route.GET(request(ctx.editorHeaders))).status).toBe(403)
  expect((await route.GET(request(ctx.anonymous))).status).toBe(401)
  const response = await route.GET(request(ctx.adminHeaders))
  expect(response.status).toBe(200)
  expect(response.headers.get('cache-control')).toBe('private, no-store')
  expect(await response.text()).toContain(`"'=cmd@example.com"`)
})
