import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { createCmsTestContext } from '../helpers/cms-context'
import { runSeeds } from '../../scripts/seed/runner'
import { lead } from '../../src/features/leads/schema'
import { auditLog } from '../../src/features/audit/schema'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: () => unknown) => fn,
}))

let ctx: Awaited<ReturnType<typeof createCmsTestContext>>
let admin: typeof import('../../src/features/leads/admin.server')

beforeAll(async () => {
  ctx = await createCmsTestContext()
  admin = await import('../../src/features/leads/admin.server')
  await ctx.connection.db.delete(lead)
  await runSeeds(ctx.connection.db, ctx.env.databaseUrl, ['--module=leads', '--demo'], 'test')
})
afterAll(async () => {
  if (!ctx) return
  await runSeeds(ctx.connection.db, ctx.env.databaseUrl, ['--module=leads', '--purge-demo'], 'test')
  await ctx.connection.db.delete(auditLog).where(eq(auditLog.entity, 'leads'))
  await ctx.cleanup()
})

const all = {
  status: '',
  interest: '',
  segment: '',
  from: '',
  to: '',
  page: 1,
  pageSize: 20,
} as const

it('refuses Editors and anonymous users at the query and the action', async () => {
  await expect(admin.listLeads(ctx.editorHeaders, all)).rejects.toThrow()
  await expect(admin.listLeads(ctx.anonymous, all)).rejects.toThrow()
  const [first] = await ctx.connection.db.select().from(lead)
  await expect(admin.getLead(ctx.editorHeaders, first.id)).rejects.toThrow()
  await expect(
    admin.updateLead(ctx.editorHeaders, { id: first.id, status: 'won', notes: '' }),
  ).rejects.toThrow()
})

it('filters by status, interest and segment, and pages', async () => {
  expect((await admin.listLeads(ctx.adminHeaders, all)).total).toBe(3)
  expect((await admin.listLeads(ctx.adminHeaders, { ...all, status: 'new' })).items).toHaveLength(1)
  expect(
    (await admin.listLeads(ctx.adminHeaders, { ...all, interest: 'AI Build' })).items[0].name,
  ).toBe('Budi (demo)')
  expect(
    (await admin.listLeads(ctx.adminHeaders, { ...all, segment: 'Startup' })).items[0].name,
  ).toBe('Citra (demo)')
  expect(admin.readLeadFilters({ status: 'hacked', page: '-1', pageSize: '7' })).toMatchObject({
    status: '',
    page: 1,
    pageSize: 20,
  })
})

it('lets an Admin change status and notes, audited by field name only', async () => {
  const [first] = await ctx.connection.db.select().from(lead).where(eq(lead.status, 'new'))
  await admin.updateLead(ctx.adminHeaders, {
    id: first.id,
    status: 'contacted',
    notes: 'Called on Monday.',
  })
  expect(await admin.getLead(ctx.adminHeaders, first.id)).toMatchObject({
    status: 'contacted',
    notes: 'Called on Monday.',
  })
  const [entry] = await ctx.connection.db
    .select()
    .from(auditLog)
    .where(eq(auditLog.entityId, first.id))
  expect(entry.changedFields).toEqual(['notes', 'status'])
  expect(JSON.stringify(entry)).not.toContain('Called on Monday')
  await expect(
    admin.updateLead(ctx.adminHeaders, { id: first.id, status: 'vip', notes: '' }),
  ).rejects.toMatchObject({
    code: 'INVALID',
  })
})
