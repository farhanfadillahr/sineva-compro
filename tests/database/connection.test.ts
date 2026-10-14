import 'dotenv/config'
import { createServer } from 'node:net'
import { afterAll, expect, it } from 'vitest'
import { createDatabase } from '../../src/lib/db/connection'
import { readTestEnv } from '../../src/env/test'

const testUrl = new URL(readTestEnv(process.env).databaseUrl)
const connection = createDatabase(testUrl.href)
afterAll(async () => {
  await connection.pool.end()
})

it('fails a stalled database handshake within the connection deadline', async () => {
  const sockets = new Set<import('node:net').Socket>()
  const server = createServer((socket) => {
    sockets.add(socket)
    socket.on('close', () => sockets.delete(socket))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Missing test listener')
  const blackholeUrl = new URL(testUrl)
  blackholeUrl.port = String(address.port)
  const blackhole = createDatabase(blackholeUrl.href)
  try {
    await expect(
      Promise.race([
        blackhole.pool.query('SELECT 1'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Test deadline exceeded')), 6500).unref(),
        ),
      ]),
    ).rejects.toThrow(/timeout|timed out/i)
  } finally {
    for (const socket of sockets) socket.destroy()
    await blackhole.pool.end()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
})

it('does not create a database when the configured database name is wrong', async () => {
  const missingUrl = new URL(testUrl)
  const missingName = `missing_${crypto.randomUUID().replaceAll('-', '')}`
  missingUrl.pathname = `/${missingName}`
  const missing = createDatabase(missingUrl.href)
  try {
    await expect(missing.pool.query('SELECT 1')).rejects.toThrow(/does not exist/i)
    const result = await connection.pool.query(
      'SELECT datname FROM pg_database WHERE datname = $1',
      [missingName],
    )
    expect(result.rows).toEqual([])
  } finally {
    await missing.pool.end()
  }
})
