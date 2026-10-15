import { spawn, type ChildProcess } from 'node:child_process'
import { createServer } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'

export type TestCommand = Readonly<{ file: string; args: readonly string[] }>
export type TestServerOptions = Readonly<{
  server: TestCommand
  tests: TestCommand
  env: NodeJS.ProcessEnv
  readyUrl: URL
  readinessTimeoutMs?: number
  pollIntervalMs?: number
  shutdownTimeoutMs?: number
}>
type ManagedProcess = { child: ChildProcess; done: Promise<number>; settled: boolean }

function start(command: TestCommand, env: NodeJS.ProcessEnv): ManagedProcess {
  const child = spawn(command.file, [...command.args], { env, stdio: 'inherit', detached: true })
  const managed = { child, settled: false } as ManagedProcess
  managed.done = new Promise((resolve) => {
    const finish = (code: number) => {
      managed.settled = true
      resolve(code)
    }
    child.once('error', () => finish(1))
    child.once('exit', (code) => finish(code ?? 1))
  })
  return managed
}
function groupExists(pid: number): boolean {
  try {
    process.kill(-pid, 0)
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error
    return false
  }
}
function signalGroup(pid: number, signal: NodeJS.Signals): void {
  try {
    process.kill(-pid, signal)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error
  }
}
async function assertPortAvailable(url: URL) {
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname)) {
    throw new Error('Readiness requires a loopback HTTP URL.')
  }
  const listener = createServer()
  await new Promise<void>((resolve, reject) => {
    listener.once('error', reject)
    listener.listen(Number(url.port || 80), url.hostname, resolve)
  })
  await new Promise<void>((resolve, reject) =>
    listener.close((error) => (error ? reject(error) : resolve())),
  )
}
async function stop(processes: ManagedProcess[], timeoutMs: number): Promise<void> {
  const pids = processes.flatMap(({ child }) => (child.pid ? [child.pid] : []))
  for (const pid of pids) signalGroup(pid, 'SIGTERM')
  const deadline = Date.now() + timeoutMs
  while (pids.some(groupExists) && Date.now() < deadline) await delay(20)
  for (const pid of pids) signalGroup(pid, 'SIGKILL')
  const reaped = await Promise.race([
    Promise.all(processes.map(({ done }) => done)).then(() => true),
    delay(1_000).then(() => false),
  ])
  if (!reaped) throw new Error('Test processes did not stop.')
}

/** Owns only the detached process groups it starts; never kills a port owner. */
export async function withTestServer(options: TestServerOptions): Promise<number> {
  if (process.platform === 'win32') {
    console.error('Production HTTP verification requires a POSIX platform.')
    return 1
  }
  const processes: ManagedProcess[] = []
  const abort = new AbortController()
  let cancellationCode = 0
  let cancel!: (code: number) => void
  const cancellation = new Promise<number>((resolve) => {
    cancel = resolve
  })
  const interrupt = (code: number) => {
    if (!cancellationCode) cancellationCode = code
    abort.abort()
    cancel(cancellationCode)
  }
  const onInt = () => interrupt(130)
  const onTerm = () => interrupt(143)
  process.on('SIGINT', onInt)
  process.on('SIGTERM', onTerm)
  let result = 1
  try {
    await assertPortAvailable(options.readyUrl)
    if (cancellationCode) return cancellationCode
    const server = start(options.server, options.env)
    processes.push(server)
    const deadline = Date.now() + (options.readinessTimeoutMs ?? 30_000)
    let ready = false
    while (!server.settled && !cancellationCode && Date.now() < deadline) {
      const requestAbort = new AbortController()
      // A stalled response must not outlive the total readiness deadline.
      const timer = setTimeout(
        () => requestAbort.abort(),
        Math.min(500, Math.max(1, deadline - Date.now())),
      )
      const onServerExit = () => requestAbort.abort()
      void server.done.then(onServerExit)
      try {
        const response = await fetch(options.readyUrl, {
          redirect: 'error',
          signal: AbortSignal.any([abort.signal, requestAbort.signal]),
        })
        ready = response.ok
        await response.body?.cancel()
      } catch {
        /* retry until deadline, server exit, or cancellation */
      } finally {
        clearTimeout(timer)
      }
      if (ready || server.settled || cancellationCode) break
      await Promise.race([delay(options.pollIntervalMs ?? 200), server.done, cancellation])
    }
    if (ready && !server.settled && !cancellationCode) {
      const tests = start(options.tests, options.env)
      processes.push(tests)
      result = await Promise.race([tests.done, server.done.then(() => 1), cancellation])
      if (server.settled) result = 1
    } else {
      console.error('Production HTTP server failed readiness.')
    }
  } catch {
    console.error('Production HTTP process or port unavailable.')
  } finally {
    abort.abort()
    try {
      await stop(processes, options.shutdownTimeoutMs ?? 2_000)
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      console.error(
        'Production HTTP cleanup failed.',
        ['EPERM', 'EINVAL', 'ESRCH'].includes(code ?? '') ? code : 'process-timeout',
      )
      result = 1
    }
    process.off('SIGINT', onInt)
    process.off('SIGTERM', onTerm)
  }
  return cancellationCode || result
}
