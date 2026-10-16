import { execFileSync, spawn, type ChildProcess } from 'node:child_process'
import { mkdir, mkdtemp, open, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { readStorageConfig } from '../../src/lib/storage/config'
import { readCredentials } from './credentials'
import { nativeCommands } from './native-config'

// Foreground supervisor for four isolated processes. SIGINT/SIGTERM stops only
// children created here; data/logs remain in a new private directory every run.
const children: ChildProcess[] = []
let stopping = false
async function stop() {
  if (stopping) return
  stopping = true
  for (const child of [...children].reverse()) child.kill('SIGTERM')
  await Promise.all(
    children.map(async (child) => {
      for (let n = 0; n < 40 && child.exitCode === null && child.signalCode === null; n++)
        await delay(100)
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
    }),
  )
}
process.once('SIGINT', () => {
  void stop()
})
process.once('SIGTERM', () => {
  void stop()
})

async function portAvailable(port: number) {
  const server = createServer()
  await new Promise<void>((accept, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', () =>
      server.close((error) => (error ? reject(error) : accept())),
    )
  })
}
try {
  const config = readStorageConfig(process.env)
  const endpoint = new URL(config.endpoint)
  if (endpoint.hostname !== '127.0.0.1' || endpoint.protocol !== 'http:' || !endpoint.port) {
    throw new Error('Native harness requires an explicit IPv4 loopback HTTP port')
  }
  const binary = resolve(process.argv[2] ?? '')
  if (!process.argv[2]) throw new Error('Pass the verified SeaweedFS 4.48 binary path')
  const version = execFileSync(binary, ['version'], { encoding: 'utf8', timeout: 5000 })
  if (!/\b4\.48\b/.test(version)) throw new Error('SeaweedFS 4.48 required')
  const secrets = resolve(process.env.STORAGE_CREDENTIALS_DIR ?? '.storage/secrets')
  await readCredentials(secrets, 'bootstrap')
  const s3port = Number(endpoint.port)
  const ports = [19333, 29333, 18080, 28080, 18888, 28888, s3port, s3port + 10000]
  if (new Set(ports).size !== ports.length || ports.some((p) => p > 65535))
    throw new Error('Port collision')
  for (const port of ports) await portAvailable(port)
  // Keep macOS Unix socket paths below sun_path's length limit.
  const tempRoot = process.platform === 'darwin' ? '/private/tmp' : tmpdir()
  const root = await mkdtemp(join(tempRoot, 'sineva-storage-'))
  for (const name of ['master', 'volume', 'filer']) await mkdir(join(root, name), { mode: 0o700 })
  // Current-directory config wins over any user/global filer backend config.
  await writeFile(
    join(root, 'filer.toml'),
    `[leveldb2]\nenabled = true\ndir = ${JSON.stringify(join(root, 'filer'))}\n`,
    { mode: 0o600 },
  )
  await writeFile(join(root, 'security.toml'), '# Isolated local harness, no global config.\n', {
    mode: 0o600,
  })
  await writeFile(join(root, 'master.toml'), '# Isolated local master.\n', { mode: 0o600 })
  const specs = nativeCommands(root, secrets, s3port)
  for (const args of specs) {
    const log = await open(join(root, `${args[0]}.log`), 'wx', 0o600)
    const child = spawn(binary, ['-logtostderr=true', ...args], {
      cwd: root,
      stdio: ['ignore', log.fd, log.fd],
    })
    await log.close()
    children.push(child)
    child.once('error', () => {
      process.exitCode = 1
      void stop()
    })
    child.once('exit', () => {
      if (!stopping) {
        process.exitCode = 1
        void stop()
      }
    })
  }
  await writeFile(
    join(root, 'processes.json'),
    JSON.stringify({ supervisor: process.pid, children: children.map((child) => child.pid) }) +
      '\n',
    { mode: 0o600 },
  )
  let ready = false
  for (let n = 0; n < 120 && !stopping; n++) {
    try {
      const response = await fetch(config.endpoint, {
        redirect: 'manual',
        signal: AbortSignal.timeout(1000),
      })
      const status = response.status
      await response.body?.cancel()
      if (status === 403) {
        ready = true
        break
      }
    } catch {
      /* wait for the gateway */
    }
    await delay(500)
  }
  if (!ready) throw new Error('Local gateway readiness timed out')
  console.log(`SeaweedFS 4.48 native ready at ${config.endpoint}. Data and private logs: ${root}`)
  console.log(
    'Use storage:bootstrap, storage:check, test:storage with the same STORAGE_ENDPOINT. Ctrl-C stops only this harness.',
  )
} catch {
  console.error(
    'Native storage startup failed. Verify binary version, free loopback ports, disk space and local 0600 credentials. Inspect only the private sineva-storage-*/ logs; do not publish raw logs.',
  )
  process.exitCode = 1
  await stop()
}
