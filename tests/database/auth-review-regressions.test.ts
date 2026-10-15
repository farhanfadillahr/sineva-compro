import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { createAuthTestContext } from '../helpers/auth-context'
import { handlePasswordLogin } from '../../src/features/auth/login-handler.server'
import { updateEditor } from '../../src/features/users/service.server'
import type { PoolClient } from 'pg'
let ctx: Awaited<ReturnType<typeof createAuthTestContext>>
beforeAll(async () => {
  ctx = await createAuthTestContext()
})
afterAll(async () => {
  await ctx.cleanup()
})
function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((r) => {
    resolve = r
  })
  return { promise, resolve }
}
it('refuses a session if an email appears after the request found no lockable account', async () => {
  const admin = await ctx.create('admin')
  const headers = await ctx.headersFor(admin)
  const e = await ctx.create('editor')
  await ctx.connection.pool.query(
    "INSERT INTO auth_lockout(user_id,failed_attempts,locked_until) VALUES ($1,5,clock_timestamp()+interval '15 minutes')",
    [e.id],
  )
  const email = `moved-${randomUUID()}@example.test`
  const lookedUp = deferred()
  const resume = deferred()
  const original = ctx.connection.db.transaction.bind(ctx.connection.db)
  const outer = vi.spyOn(ctx.connection.db, 'transaction').mockImplementationOnce((run, config) =>
    original(async (tx) => {
      const execute = tx.execute.bind(tx)
      const spy = vi
        .spyOn(tx, 'execute')
        .mockImplementationOnce(execute)
        .mockImplementationOnce((...args) => {
          const raw = execute(...args)
          const executeRaw = raw.execute.bind(raw)
          vi.spyOn(raw, 'execute').mockImplementation(async () => {
            const result = await executeRaw()
            lookedUp.resolve()
            await resume.promise
            return result
          })
          return raw
        })
      try {
        return await run(tx)
      } finally {
        spy.mockRestore()
      }
    }, config),
  )
  let pending: Promise<Response> | undefined
  try {
    pending = handlePasswordLogin(ctx.connection.db, ctx.env, ctx.request(email, e.password))
    await lookedUp.promise
    await updateEditor(ctx.connection.db, ctx.env, headers, { userId: e.id, name: e.name, email })
    resume.resolve()
    const response = await pending
    expect(response.status).toBe(401)
    expect(response.headers.getSetCookie()).toEqual([])
    expect(
      (await ctx.connection.pool.query('SELECT id FROM session WHERE user_id=$1', [e.id])).rows,
    ).toEqual([])
    expect(
      (
        await ctx.connection.pool.query(
          'SELECT failed_attempts,locked_until > clock_timestamp() AS locked FROM auth_lockout WHERE user_id=$1',
          [e.id],
        )
      ).rows,
    ).toEqual([{ failed_attempts: 5, locked: true }])
  } finally {
    resume.resolve()
    await pending?.catch(() => {})
    outer.mockRestore()
  }
})
it('releases checked-out clients after repeated failed BEGIN and recovers normal transactions', async () => {
  const clients: PoolClient[] = []
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    for (let i = 0; i < 3; i++) {
      ctx.connection.pool.once('acquire', (client) => {
        clients.push(client)
        vi.spyOn(client, 'query').mockImplementationOnce(async () => {
          throw new Error('fixture BEGIN failure')
        })
      })
      const response = await handlePasswordLogin(
        ctx.connection.db,
        ctx.env,
        ctx.request(`missing-${randomUUID()}@example.test`, 'test-password'),
      )
      expect(response.status).toBe(503)
      expect(response.headers.getSetCookie()).toEqual([])
    }
    expect(ctx.connection.pool.totalCount).toBe(ctx.connection.pool.idleCount)
    const e = await ctx.create('editor')
    expect(
      (await handlePasswordLogin(ctx.connection.db, ctx.env, ctx.request(e.email, e.password)))
        .status,
    ).toBe(200)
  } finally {
    for (const client of clients) {
      try {
        client.release(true)
      } catch {}
    }
    log.mockRestore()
  }
})
it('contains active client connection errors and discards the affected checkout', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  let client: PoolClient | undefined
  try {
    ctx.connection.pool.once('acquire', (value) => {
      client = value
    })
    await expect(
      ctx.connection.db.transaction(async () => {
        if (!client) throw new Error('Missing checked-out client')
        expect(() => client!.emit('error', new Error('private socket detail'))).not.toThrow()
      }),
    ).rejects.toThrow('Database connection failed.')
    expect(ctx.connection.pool.totalCount).toBe(ctx.connection.pool.idleCount)
    const e = await ctx.create('editor')
    expect(
      (await handlePasswordLogin(ctx.connection.db, ctx.env, ctx.request(e.email, e.password)))
        .status,
    ).toBe(200)
    expect(JSON.stringify(log.mock.calls)).not.toContain('private socket detail')
  } finally {
    log.mockRestore()
  }
})

it('rejects an actor demoted while its mutation is waiting for the actor row lock', async () => {
  const admin = await ctx.create('admin')
  const headers = await ctx.headersFor(admin)
  const editor = await ctx.create('editor')
  const locker = await ctx.connection.pool.connect()
  const reachedLock = deferred()
  const original = ctx.connection.db.transaction.bind(ctx.connection.db)
  const outer = vi.spyOn(ctx.connection.db, 'transaction').mockImplementationOnce((run, config) => {
    let acquired: PoolClient | undefined
    ctx.connection.pool.once('acquire', (value) => {
      acquired = value
    })
    return original(async (tx) => {
      if (!acquired) throw new Error('Missing checked-out client')
      const client = acquired
      const query = client.query.bind(client)
      const spy = vi.spyOn(client, 'query').mockImplementation((...args) => {
        const first: unknown = args[0]
        const statement =
          typeof first === 'string'
            ? first
            : first && typeof first === 'object' && 'text' in first
              ? first.text
              : undefined
        if (typeof statement === 'string' && statement.toLowerCase().includes('for update'))
          reachedLock.resolve()
        return Reflect.apply(query, client, args)
      })
      try {
        return await run(tx)
      } finally {
        spy.mockRestore()
      }
    }, config)
  })
  let pending: ReturnType<typeof updateEditor> | undefined
  try {
    await locker.query('BEGIN')
    await locker.query('SELECT id FROM "user" WHERE id=$1 FOR UPDATE', [admin.id])
    pending = updateEditor(ctx.connection.db, ctx.env, headers, {
      userId: editor.id,
      name: 'Unauthorized Rename',
      email: editor.email,
    })
    // Attach rejection handling immediately while the real SQL waits.
    const rejected = expect(pending).rejects.toMatchObject({ code: 'FORBIDDEN' })
    await reachedLock.promise
    await locker.query('UPDATE "user" SET role=$1 WHERE id=$2', ['editor', admin.id])
    await locker.query('COMMIT')
    await rejected
    expect(
      (await ctx.connection.pool.query('SELECT name FROM "user" WHERE id=$1', [editor.id])).rows,
    ).toEqual([{ name: editor.name }])
  } finally {
    await locker.query('ROLLBACK')
    locker.release()
    await pending?.catch(() => {})
    outer.mockRestore()
  }
})
