import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import { createCmsTestContext } from '../helpers/cms-context'
import { lead } from '../../src/features/leads/schema'
import { auditLog } from '../../src/features/audit/schema'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: () => unknown) => fn,
}))

let ctx: Awaited<ReturnType<typeof createCmsTestContext>>
let retention: typeof import('../../src/features/leads/retention.server')

beforeAll(async () => {
  ctx = await createCmsTestContext()
  retention = await import('../../src/features/leads/retention.server')
  await ctx.connection.db.delete(lead)
})
afterAll(async () => {
  if (!ctx) return
  await ctx.connection.db.delete(lead)
  await ctx.connection.db.delete(auditLog).where(eq(auditLog.entity, 'leads'))
  await ctx.cleanup()
})

const NOW = new Date('2026-10-18T00:00:00Z')
const monthsAgo = (months: number) => {
  const date = new Date(NOW)
  date.setUTCMonth(date.getUTCMonth() - months)
  return date
}
async function storeLead(name: string, createdAt: Date, updatedAt = createdAt) {
  const [row] = await ctx.connection.db
    .insert(lead)
    .values({
      name,
      email: `${name.toLowerCase()}@example.com`,
      phone: '6281234567890',
      segment: 'Startup',
      interest: 'AI Build',
      message: 'We need help with customer chats every day.',
      consentAt: createdAt,
      locale: 'en',
      sourcePage: '/contact',
      createdAt,
      updatedAt,
    })
    .returning({ id: lead.id })
  return row.id
}

// CPR-111: the privacy policy keeps contact messages 24 months after the last contact.
it('deletes only leads whose last contact is older than 24 months, audited as the system', async () => {
  const expired = await storeLead('Old', monthsAgo(25))
  const recent = await storeLead('Recent', monthsAgo(3))
  const followedUp = await storeLead('Followed', monthsAgo(30), monthsAgo(2))

  expect(await retention.purgeExpiredLeads(NOW, ctx.connection.db)).toBe(1)

  const left = await ctx.connection.db
    .select({ id: lead.id })
    .from(lead)
    .where(inArray(lead.id, [expired, recent, followedUp]))
  expect(left.map((r) => r.id).sort()).toEqual([recent, followedUp].sort())

  const [entry] = await ctx.connection.db
    .select()
    .from(auditLog)
    .where(eq(auditLog.entityId, expired))
  expect(entry).toMatchObject({ actorId: null, action: 'expire', entity: 'leads' })
  expect(JSON.stringify(entry)).not.toContain('old@example.com')

  // Running again the same day deletes nothing more.
  expect(await retention.purgeExpiredLeads(NOW, ctx.connection.db)).toBe(0)
})
