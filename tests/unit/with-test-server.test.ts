import { spawn, type ChildProcess } from 'node:child_process'
import { createServer } from 'node:net'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { withTestServer, type TestServerOptions } from '../../scripts/lib/with-test-server'

let directory: string
let url: URL
const workers: ChildProcess[] = []

async function bind(port: number) {
  const server = createServer()
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', resolve)
  })
  return server
}
async function freeUrl() {
  const server = await bind(0)
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Missing test port')
  const result = new URL(`http://127.0.0.1:${address.port}`)
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  )
  return result
}
function node(code: string) {
  return { file: process.execPath, args: ['-e', code] }
}
function pidFile(name: string) {
  return join(directory, name)
}
function serverCode(extra = '') {
  return `require('node:fs').writeFileSync(${JSON.stringify(pidFile('server.pid'))},String(process.pid));${extra};require('node:http').createServer((q,s)=>s.end('ok')).listen(${url.port},'127.0.0.1')`
}
function options(patch: Partial<TestServerOptions> = {}): TestServerOptions {
  return {
    server: node(serverCode()),
    tests: node(
      `require('node:fs').writeFileSync(${JSON.stringify(pidFile('tests.pid'))},String(process.pid))`,
    ),
    env: process.env,
    readyUrl: url,
    readinessTimeoutMs: 2_000,
    pollIntervalMs: 20,
    shutdownTimeoutMs: 150,
    ...patch,
  }
}
async function until(check: () => Promise<boolean>, timeoutMs = 3_000) {
  const deadline = Date.now() + timeoutMs
  while (!(await check())) {
    if (Date.now() >= deadline) throw new Error('Test condition timed out')
    await delay(20)
  }
}
async function exists(name: string) {
  try {
    await readFile(pidFile(name))
    return true
  } catch {
    return false
  }
}
async function gone(name: string) {
  const pid = Number(await readFile(pidFile(name), 'utf8'))
  await until(async () => {
    try {
      process.kill(pid, 0)
      return false
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error
      return true
    }
  })
}
async function portFree() {
  const server = await bind(Number(url.port))
  await new Promise<void>((resolve) => server.close(() => resolve()))
}
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'cpr10-lifecycle-'))
  url = await freeUrl()
})
afterEach(async () => {
  for (const worker of workers.splice(0)) {
    if (worker.exitCode === null) worker.kill('SIGKILL')
  }
  // Emergency cleanup is limited to fixture PIDs recorded in this test's own directory.
  for (const name of ['server.pid', 'tests.pid', 'grandchild.pid']) {
    if (await exists(name)) {
      const pid = Number(await readFile(pidFile(name), 'utf8'))
      try {
        process.kill(-pid, 'SIGKILL')
      } catch {
        /* group already gone */
      }
      try {
        process.kill(pid, 'SIGKILL')
      } catch {
        /* process already gone */
      }
    }
  }
  await rm(directory, { recursive: true })
})

it.each([0, 7])('returns test exit %i and releases its server', async (code) => {
  expect(await withTestServer(options({ tests: node(`process.exit(${code})`) }))).toBe(code)
  await gone('server.pid')
  await portFree()
})
it('times out readiness without starting tests and cleans the server', async () => {
  expect(
    await withTestServer(
      options({
        server: node(
          `require('node:fs').writeFileSync(${JSON.stringify(pidFile('server.pid'))},String(process.pid));setInterval(()=>{},1000)`,
        ),
        readinessTimeoutMs: 300,
      }),
    ),
  ).toBe(1)
  expect(await exists('tests.pid')).toBe(false)
  await gone('server.pid')
})
it.each([0, 9])('rejects early server exit %i without starting tests', async (code) => {
  expect(await withTestServer(options({ server: node(`process.exit(${code})`) }))).toBe(1)
  expect(await exists('tests.pid')).toBe(false)
})
it('handles server spawn errors without running tests', async () => {
  expect(
    await withTestServer(options({ server: { file: '/nonexistent/cpr10/server', args: [] } })),
  ).toBe(1)
  expect(await exists('tests.pid')).toBe(false)
})
it('handles test spawn errors and releases the server', async () => {
  expect(
    await withTestServer(options({ tests: { file: '/nonexistent/cpr10/tests', args: [] } })),
  ).toBe(1)
  await gone('server.pid')
  await portFree()
})
it('fails and stops hanging tests when the server dies during testing', async () => {
  const code = `const fs=require('node:fs');fs.writeFileSync(${JSON.stringify(pidFile('tests.pid'))},String(process.pid));process.kill(Number(fs.readFileSync(${JSON.stringify(pidFile('server.pid'))},'utf8')),'SIGTERM');setInterval(()=>{},1000)`
  expect(await withTestServer(options({ tests: node(code) }))).toBe(1)
  await gone('tests.pid')
  await portFree()
})
it('refuses an occupied port and leaves its owner alive', async () => {
  const owner = await bind(Number(url.port))
  try {
    expect(await withTestServer(options())).toBe(1)
    expect(await exists('server.pid')).toBe(false)
    expect(await exists('tests.pid')).toBe(false)
    expect(owner.listening).toBe(true)
  } finally {
    await new Promise<void>((resolve) => owner.close(() => resolve()))
  }
})
it('kills a server that ignores SIGTERM after the shutdown deadline', async () => {
  expect(
    await withTestServer(options({ server: node(serverCode("process.on('SIGTERM',()=>{})")) })),
  ).toBe(0)
  await gone('server.pid')
  await portFree()
})
it.each([false, true])('cleans the descendant when wrapper exits early=%s', async (earlyExit) => {
  const grandchild = `require('node:fs').writeFileSync(${JSON.stringify(pidFile('grandchild.pid'))},String(process.pid));require('node:http').createServer((q,s)=>s.end('ok')).listen(${url.port},'127.0.0.1')`
  const wrapper = `require('node:fs').writeFileSync(${JSON.stringify(pidFile('server.pid'))},String(process.pid));require('node:child_process').spawn(process.execPath,['-e',${JSON.stringify(grandchild)}],{stdio:'inherit'});${earlyExit ? 'setTimeout(()=>process.exit(0),200)' : 'setInterval(()=>{},1000)'}`
  const result = await withTestServer(
    options({ server: node(wrapper), tests: node('setTimeout(()=>process.exit(0),400)') }),
  )
  expect(result).toBe(earlyExit ? 1 : 0)
  await gone('grandchild.pid')
  await portFree()
})
it.each([
  ['SIGINT', 130, 'startup'],
  ['SIGTERM', 143, 'startup'],
  ['SIGINT', 130, 'testing'],
  ['SIGTERM', 143, 'testing'],
] as const)(
  'cleans processes on %s in %s mode',
  async (signal, status, phase) => {
    const current = options({
      server: node(
        phase === 'startup'
          ? `require('node:fs').writeFileSync(${JSON.stringify(pidFile('server.pid'))},String(process.pid));setInterval(()=>{},1000)`
          : serverCode(),
      ),
      tests: node(
        `require('node:fs').writeFileSync(${JSON.stringify(pidFile('tests.pid'))},String(process.pid));setInterval(()=>{},1000)`,
      ),
    })
    const config = pidFile('config.json')
    await writeFile(config, JSON.stringify({ ...current, env: undefined, readyUrl: url.href }))
    const worker = spawn(
      process.execPath,
      ['--import', 'tsx', 'tests/fixtures/test-server-worker.ts', config],
      { stdio: 'ignore' },
    )
    workers.push(worker)
    const exit = new Promise<number | null>((resolve, reject) => {
      worker.once('error', reject)
      worker.once('exit', resolve)
    })
    await until(() => exists(phase === 'startup' ? 'server.pid' : 'tests.pid'))
    worker.kill(signal)
    expect(await exit).toBe(status)
    await gone('server.pid')
    if (phase === 'testing') await gone('tests.pid')
    await portFree()
  },
  10_000,
)
