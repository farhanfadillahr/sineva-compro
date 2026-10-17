import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { eq, inArray } from 'drizzle-orm'
import { createAuthTestContext, type TestIdentity } from '../helpers/auth-context'
import { auditLog } from '../../src/features/audit/schema'
import { writeAudit } from '../../src/features/audit/service.server'
import { listAuditLog } from '../../src/features/audit/query.server'
import { user } from '../../src/features/auth/schema'
import {
  createEditor,
  updateEditor,
  setEditorActive,
  changeEditorPassword,
} from '../../src/features/users/service.server'

let ctx: Awaited<ReturnType<typeof createAuthTestContext>>,
  admin: TestIdentity,
  editor: TestIdentity,
  headers: Headers
beforeAll(async () => {
  ctx = await createAuthTestContext()
  admin = await ctx.create('admin')
  editor = await ctx.create('editor')
  headers = await ctx.headersFor(admin)
})
afterAll(async () => {
  if (ctx) {
    await ctx.connection.db.delete(auditLog).where(inArray(auditLog.actorId, [admin.id, editor.id]))
    await ctx.cleanup()
  }
})
const actor = () => ({ id: admin.id, name: admin.name, role: 'admin' as const })

it('commits mutation and audit together and removes both on rollback', async () => {
  const entityId = randomUUID()
  await expect(
    ctx.connection.db.transaction(async (tx) => {
      await tx.update(user).set({ name: 'Rolled back' }).where(eq(user.id, editor.id))
      await writeAudit(tx, actor(), {
        entity: 'users',
        entityId,
        action: 'update',
        changedFields: ['name'],
      })
      throw new Error('rollback fixture')
    }),
  ).rejects.toThrow('rollback fixture')
  expect(
    await ctx.connection.db.select().from(auditLog).where(eq(auditLog.entityId, entityId)),
  ).toEqual([])
  expect((await ctx.connection.db.select().from(user).where(eq(user.id, editor.id)))[0].name).toBe(
    editor.name,
  )
  await ctx.connection.db.transaction(async (tx) => {
    await tx.update(user).set({ name: 'Committed' }).where(eq(user.id, editor.id))
    await writeAudit(tx, actor(), {
      entity: 'users',
      entityId,
      action: 'update',
      changedFields: ['name'],
    })
  })
  expect(
    await ctx.connection.db.select().from(auditLog).where(eq(auditLog.entityId, entityId)),
  ).toHaveLength(1)
  expect((await ctx.connection.db.select().from(user).where(eq(user.id, editor.id)))[0].name).toBe(
    'Committed',
  )
})

it('denies direct audit reads for anonymous and Editor callers', async () => {
  await expect(listAuditLog(ctx.connection.db, ctx.env, new Headers(), {})).rejects.toMatchObject({
    code: 'UNAUTHORIZED',
  })
  await expect(
    listAuditLog(ctx.connection.db, ctx.env, await ctx.headersFor(editor), {}),
  ).rejects.toMatchObject({ code: 'FORBIDDEN' })
})

it('filters actor/entity together and paginates a stable newest-first list', async () => {
  const ids = [randomUUID(), randomUUID(), randomUUID()]
  await ctx.connection.db.transaction(async (tx) => {
    for (const id of ids)
      await writeAudit(tx, actor(), {
        entity: 'pages',
        entityId: id,
        action: 'update',
        changedFields: ['data'],
      })
    await writeAudit(
      tx,
      { ...actor(), id: editor.id, role: 'editor' },
      { entity: 'pages', entityId: randomUUID(), action: 'update', changedFields: ['data'] },
    )
  })
  const first = await listAuditLog(ctx.connection.db, ctx.env, headers, {
    actor: admin.id,
    entity: 'pages',
    pageSize: 2,
  })
  const second = await listAuditLog(ctx.connection.db, ctx.env, headers, {
    actor: admin.id,
    entity: 'pages',
    pageSize: 2,
    page: 2,
  })
  expect(first.total).toBe(3)
  expect(first.entries).toHaveLength(2)
  expect(second.entries).toHaveLength(1)
  expect(new Set([...first.entries, ...second.entries].map((row) => row.entityId))).toEqual(
    new Set(ids),
  )
  expect(first.entries[0].createdAt.getTime()).toBeGreaterThanOrEqual(
    first.entries[1].createdAt.getTime(),
  )
  expect(
    (
      await listAuditLog(ctx.connection.db, ctx.env, headers, {
        actor: admin.id,
        entity: 'pages',
        page: 999,
      })
    ).page,
  ).toBe(1)
})

it('records all existing Users mutations with actor and field names, excluding identity/password values', async () => {
  const password = randomUUID(),
    newPassword = randomUUID(),
    email = `audit-${randomUUID()}@example.test`
  const created = await createEditor(ctx.connection.db, ctx.env, headers, {
    name: 'Audit identity',
    email,
    password,
  })
  ctx.track(created.id)
  await updateEditor(ctx.connection.db, ctx.env, headers, {
    userId: created.id,
    name: 'Changed identity',
    email,
  })
  await setEditorActive(ctx.connection.db, ctx.env, headers, { userId: created.id, active: false })
  await setEditorActive(ctx.connection.db, ctx.env, headers, { userId: created.id, active: true })
  await changeEditorPassword(ctx.connection.db, ctx.env, headers, {
    userId: created.id,
    newPassword,
  })
  const rows = await ctx.connection.db
    .select()
    .from(auditLog)
    .where(eq(auditLog.entityId, created.id))
  expect(rows).toHaveLength(5)
  expect(rows.map((row) => row.action).sort()).toEqual([
    'activate',
    'create',
    'deactivate',
    'password_change',
    'update',
  ])
  expect(rows.every((row) => row.actorId === admin.id)).toBe(true)
  expect(rows.find((row) => row.action === 'create')?.changedFields).toContain('role')
  expect(rows.find((row) => row.action === 'update')?.changedFields).toEqual(['name'])
  for (const value of [password, newPassword, email, 'Changed identity', 'Audit identity'])
    expect(JSON.stringify(rows)).not.toContain(value)
})

it('fails the Users mutation closed when audit insert fails', async () => {
  const target = await ctx.create('editor')
  await ctx.connection.pool.query(
    "CREATE FUNCTION audit_fixture_reject() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'audit unavailable'; END $$",
  )
  await ctx.connection.pool.query(
    'CREATE TRIGGER audit_fixture_reject BEFORE INSERT ON audit_log FOR EACH ROW EXECUTE FUNCTION audit_fixture_reject()',
  )
  try {
    await expect(
      updateEditor(ctx.connection.db, ctx.env, headers, {
        userId: target.id,
        name: 'Must rollback',
        email: target.email,
      }),
    ).rejects.toMatchObject({ code: 'UNAVAILABLE' })
    expect(
      (await ctx.connection.db.select().from(user).where(eq(user.id, target.id)))[0].name,
    ).toBe(target.name)
    expect(
      await ctx.connection.db.select().from(auditLog).where(eq(auditLog.entityId, target.id)),
    ).toEqual([])
  } finally {
    await ctx.connection.pool.query('DROP TRIGGER audit_fixture_reject ON audit_log')
    await ctx.connection.pool.query('DROP FUNCTION audit_fixture_reject()')
  }
})

it('keeps only field names for secrets and lead personal data', async () => {
  const id = randomUUID()
  await ctx.connection.db.transaction(async (tx) => {
    await writeAudit(tx, actor(), {
      entity: 'email_settings',
      entityId: id,
      action: 'update',
      changedFields: ['smtpPassword', 'apiKey'],
    })
    await writeAudit(tx, actor(), {
      entity: 'leads',
      entityId: id,
      action: 'update',
      changedFields: ['email', 'phone', 'notes'],
    })
    await expect(
      writeAudit(tx, actor(), {
        entity: 'leads',
        entityId: id,
        action: 'update',
        changedFields: ['email'],
        values: { email: 'private@example.com' },
      } as never),
    ).rejects.toThrow()
  })
  const rows = await ctx.connection.db.select().from(auditLog).where(eq(auditLog.entityId, id))
  expect(rows).toHaveLength(2)
  expect(rows.map((row) => row.changedFields)).toEqual([
    ['apiKey', 'smtpPassword'],
    ['email', 'notes', 'phone'],
  ])
  expect(JSON.stringify(rows)).not.toContain('private@example.com')
})
