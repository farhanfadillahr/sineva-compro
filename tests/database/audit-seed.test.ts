import { afterAll, beforeAll, expect, it } from 'vitest'
import { count, eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { createAuthTestContext } from '../helpers/auth-context'
import { auditLog } from '../../src/features/audit/schema'
import { user } from '../../src/features/auth/schema'
import { runSeeds } from '../../scripts/seed/runner'
import { auditDemoActorId, auditDemoId } from '../../scripts/seed/audit'

let ctx: Awaited<ReturnType<typeof createAuthTestContext>>
beforeAll(async () => {
  ctx = await createAuthTestContext()
})
afterAll(async () => {
  if (ctx) await ctx.cleanup()
})
const run = (args: string[]) => runSeeds(ctx.connection.db, ctx.env.databaseUrl, args, 'test')

it('runs base and demo twice idempotently, then purges only ticket-owned demo data', async () => {
  const existing = await ctx.create('admin'),
    realId = randomUUID(),
    otherDemo = randomUUID()
  await ctx.connection.db.insert(auditLog).values([
    {
      id: realId,
      actorId: existing.id,
      entity: 'users',
      entityId: existing.id,
      action: 'update',
      changedFields: ['name'],
    },
    {
      id: otherDemo,
      actorId: existing.id,
      entity: 'users',
      entityId: existing.id,
      action: 'update',
      changedFields: ['name'],
      isDemo: true,
    },
  ])
  try {
    const [before] = await ctx.connection.db.select({ total: count() }).from(auditLog)
    await run([])
    await run([])
    expect((await ctx.connection.db.select({ total: count() }).from(auditLog))[0].total).toBe(before.total)
    await run(['--demo'])
    await run(['--demo'])
    expect(
      await ctx.connection.db.select().from(auditLog).where(eq(auditLog.id, auditDemoId)),
    ).toHaveLength(1)
    expect(
      await ctx.connection.db.select().from(user).where(eq(user.id, auditDemoActorId)),
    ).toMatchObject([{ banned: true, role: 'editor' }])
    await run(['--purge-demo'])
    await run(['--purge-demo'])
    expect(
      await ctx.connection.db.select().from(auditLog).where(eq(auditLog.id, auditDemoId)),
    ).toEqual([])
    expect(
      await ctx.connection.db.select().from(user).where(eq(user.id, auditDemoActorId)),
    ).toEqual([])
    expect(
      await ctx.connection.db.select().from(auditLog).where(eq(auditLog.id, realId)),
    ).toHaveLength(1)
    expect(
      await ctx.connection.db.select().from(auditLog).where(eq(auditLog.id, otherDemo)),
    ).toHaveLength(1)
    expect(
      await ctx.connection.db.select().from(user).where(eq(user.id, existing.id)),
    ).toHaveLength(1)
  } finally {
    await ctx.connection.db.delete(auditLog).where(eq(auditLog.id, realId))
    await ctx.connection.db.delete(auditLog).where(eq(auditLog.id, otherDemo))
  }
})

it('preserves a demo actor changed by an operator even when the main identity still matches', async () => {
  await run(['--demo'])
  await ctx.connection.db.update(user).set({ banReason: 'Operator managed account' }).where(eq(user.id, auditDemoActorId))
  try {
    await run(['--purge-demo'])
    expect(await ctx.connection.db.select().from(user).where(eq(user.id, auditDemoActorId))).toMatchObject([{ banReason: 'Operator managed account' }])
  } finally {
    await ctx.connection.db.delete(user).where(eq(user.id, auditDemoActorId))
  }
})

it('never adopts or deletes a pre-existing actor with a reserved demo identifier', async () => {
  await ctx.connection.db
    .insert(user)
    .values({
      id: auditDemoActorId,
      name: 'Existing actor',
      email: `existing-${randomUUID()}@example.com`,
    })
  try {
    await expect(run(['--demo'])).rejects.toThrow()
    await run(['--purge-demo'])
    expect(
      (await ctx.connection.db.select().from(user).where(eq(user.id, auditDemoActorId)))[0].name,
    ).toBe('Existing actor')
    expect(
      await ctx.connection.db.select().from(auditLog).where(eq(auditLog.id, auditDemoId)),
    ).toEqual([])
  } finally {
    await ctx.connection.db.delete(user).where(eq(user.id, auditDemoActorId))
  }
})

it('preserves demo actors adopted by real application records', async () => {
  await run(['--demo'])
  const realId = randomUUID()
  await ctx.connection.db
    .insert(auditLog)
    .values({
      id: realId,
      actorId: auditDemoActorId,
      entity: 'pages',
      entityId: 'real-record',
      action: 'update',
      changedFields: ['data'],
    })
  try {
    await run(['--purge-demo'])
    expect(
      (await ctx.connection.db.select().from(auditLog).where(eq(auditLog.id, realId)))[0].actorId,
    ).toBe(auditDemoActorId)
    expect(
      await ctx.connection.db.select().from(user).where(eq(user.id, auditDemoActorId)),
    ).toHaveLength(1)
  } finally {
    await ctx.connection.db.delete(auditLog).where(eq(auditLog.id, realId))
    await ctx.connection.db.delete(user).where(eq(user.id, auditDemoActorId))
  }
})
