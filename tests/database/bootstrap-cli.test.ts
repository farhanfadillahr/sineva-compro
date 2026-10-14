import 'dotenv/config'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { afterAll, expect, it } from 'vitest'
import { createDatabase } from '../../src/lib/db/connection'
import { readTestEnv } from '../../src/env/test'

const env = readTestEnv(process.env)
const connection = createDatabase(env.databaseUrl)
const identity = {
  name: 'CLI Test',
  email: `cli-${randomUUID()}@example.test`,
  password: randomUUID(),
}
afterAll(async () => {
  await connection.pool.query('DELETE FROM "user" WHERE email = $1', [identity.email])
  await connection.pool.end()
})

function run(args: string[]) {
  return new Promise<{ code: number | null; output: string }>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ['--import', 'tsx', 'scripts/bootstrap-admin.ts', '--stdin', ...args],
      {
        env: { ...process.env, DATABASE_URL: env.databaseUrl },
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    )
    let output = ''
    child.stdout.on('data', (value) => {
      output += value.toString()
    })
    child.stderr.on('data', (value) => {
      output += value.toString()
    })
    child.on('error', reject)
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ code, output })
    })
    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      reject(new Error('CLI deadline exceeded'))
    }, 15000)
    child.stdin.end(JSON.stringify(identity))
  })
}

it('refuses an unconfirmed database without printing credentials', async () => {
  const result = await run([])
  expect(result.code).toBe(1)
  expect(result.output).not.toContain(identity.password)
  const count = await connection.pool.query('SELECT count(*)::int AS count FROM "user"')
  expect(count.rows[0].count).toBe(0)
})

it('allows two independent operator processes to create only one first Admin', async () => {
  const count = await connection.pool.query('SELECT count(*)::int AS count FROM "user"')
  if (count.rows[0].count) throw new Error('CLI race test needs an empty isolated DB')
  const results = await Promise.all([
    run(['--confirm-database=sineva_compro_app_test']),
    run(['--confirm-database=sineva_compro_app_test']),
  ])
  expect(results.map((r) => r.code)).toEqual([0, 0])
  expect(results.filter((r) => r.output.includes('Admin pertama berhasil dibuat.'))).toHaveLength(1)
  expect(
    results.filter((r) => r.output.includes('bootstrap tidak membuat akun tambahan.')),
  ).toHaveLength(1)
  for (const result of results) expect(result.output).not.toContain(identity.password)
  const users = await connection.pool.query('SELECT role FROM "user" WHERE email = $1', [
    identity.email,
  ])
  expect(users.rows).toEqual([{ role: 'admin' }])
})
