import 'dotenv/config'
import { createServer, type Socket } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'
import { BasePayload, createLocalReq, registerFirstUserOperation } from 'payload'
import type { CollectionBeforeOperationHook } from 'payload'
import { describe, expect, it } from 'vitest'

const databaseUrl = new URL(process.env.TEST_DATABASE_URL ?? '')
if (
  !['localhost', '127.0.0.1'].includes(databaseUrl.hostname) ||
  !['postgres:', 'postgresql:'].includes(databaseUrl.protocol) ||
  databaseUrl.pathname !== '/sineva_compro_test'
) {
  throw new Error('Database safety tests require the isolated loopback sineva_compro_test database')
}

process.env.DATABASE_URL = databaseUrl.href
const { default: configPromise } = await import('../../src/payload.config')
const config = await configPromise

async function preparePayload(connectionString = databaseUrl.href) {
  const payload = await new BasePayload().init({
    config,
    disableDBConnect: true,
  })
  payload.logger.level = 'silent'
  payload.db.poolOptions = { ...payload.db.poolOptions, connectionString }
  // A rejected connect also rejects this adapter lifecycle promise.
  void payload.db.initializing.catch(() => {})
  return payload
}

describe('foundation database safety', () => {
  it('bounds startup when a TCP listener never completes the PostgreSQL handshake', async () => {
    const sockets = new Set<Socket>()
    const server = createServer((socket) => {
      sockets.add(socket)
      socket.on('close', () => sockets.delete(socket))
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Missing test TCP port')
    const url = new URL(databaseUrl)
    url.port = String(address.port)
    const payload = await preparePayload(url.href)
    const connecting = payload.db.connect!().then(
      () => 'connected',
      () => 'rejected',
    )
    try {
      const outcome = await Promise.race([connecting, delay(6000, 'deadline exceeded')])
      expect(outcome).toBe('rejected')
    } finally {
      for (const socket of sockets) socket.destroy()
      await connecting
      await new Promise<void>((resolve) => server.close(() => resolve()))
      await payload.destroy()
    }
  })

  it('rejects a missing database without creating a replacement', async () => {
    const control = await preparePayload()
    await control.db.connect!()
    const name = `sineva_missing_${process.pid}_${Date.now()}`
    const url = new URL(databaseUrl)
    url.pathname = `/${name}`
    const payload = await preparePayload(url.href)
    try {
      const outcome = await payload.db.connect!().then(
        () => 'connected',
        () => 'rejected',
      )
      const result = await control.db.pool.query<{ exists: boolean }>(
        'SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = $1) AS exists',
        [name],
      )
      expect(outcome).toBe('rejected')
      expect(result.rows[0].exists).toBe(false)
    } finally {
      // Only this test-generated name on the test cluster can be removed.
      await control.db.pool.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`)
      await payload.destroy()
      await control.destroy()
    }
  })

  it('commits one concurrent bootstrap while permitting authenticated user creation', async () => {
    const payload = await preparePayload()
    await payload.db.connect!()
    const { totalDocs } = await payload.count({ collection: 'users', overrideAccess: true })
    if (totalDocs !== 0)
      throw new Error('Bootstrap race test requires an empty disposable test database')

    const emails = [1, 2, 3].map((number) => `bootstrap-${process.pid}-${number}@example.invalid`)
    const password = 'Disposable-foundation-test-password-123'
    const collection = payload.collections.users
    const hooks = collection.config.hooks.beforeOperation ?? []
    let arrivals = 0
    let release!: () => void
    const barrier = new Promise<void>((resolve) => {
      release = resolve
    })
    const synchronize: CollectionBeforeOperationHook = async ({ args, operation }) => {
      if (operation === 'create' && !args.req.user) {
        arrivals += 1
        if (arrivals === 2) release()
        await barrier
      }
      return args
    }
    collection.config.hooks.beforeOperation = [synchronize, ...hooks]
    try {
      const requests = await Promise.all([createLocalReq({}, payload), createLocalReq({}, payload)])
      const results = await Promise.allSettled(
        requests.map((req, index) =>
          registerFirstUserOperation({ collection, data: { email: emails[index], password }, req }),
        ),
      )
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
      expect((await payload.count({ collection: 'users', overrideAccess: true })).totalDocs).toBe(1)

      collection.config.hooks.beforeOperation = hooks
      const winner = results.find((result) => result.status === 'fulfilled')
      if (!winner || winner.status !== 'fulfilled' || !winner.value.user) {
        throw new Error('Bootstrap produced no authenticated user')
      }
      const invited = await payload.create({
        collection: 'users',
        data: { email: emails[2], password },
        overrideAccess: false,
        user: { ...winner.value.user, collection: 'users' },
      })
      expect(invited.email).toBe(emails[2])
    } finally {
      collection.config.hooks.beforeOperation = hooks
      await payload.delete({
        collection: 'users',
        where: { email: { in: emails } },
        overrideAccess: true,
      })
      await payload.destroy()
    }
  })
})
