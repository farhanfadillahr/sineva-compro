import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { expect, it } from 'vitest'

it('refuses a remote setup before writing files and emits no input secrets', async () => {
  const root = await mkdtemp(join(tmpdir(), 'sineva-storage-guard-'))
  try {
    const result = spawnSync(
      process.execPath,
      ['--import', 'tsx', 'scripts/storage/cli.ts', 'setup'],
      {
        cwd: resolve('.'),
        encoding: 'utf8',
        timeout: 10_000,
        env: {
          ...process.env,
          STORAGE_ENDPOINT: 'https://user:do-not-log-this@example.test',
          STORAGE_CREDENTIALS_DIR: join(root, 'uncreated', 'secrets'),
        },
      },
    )
    expect(result.status).toBe(1)
    expect(existsSync(join(root, 'uncreated'))).toBe(false)
    expect(result.stderr).toContain('Storage command failed')
    expect(result.stderr + result.stdout).not.toContain('do-not-log-this')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
