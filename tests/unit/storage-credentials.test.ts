import { afterEach, expect, it } from 'vitest'
import { chmod, lstat, mkdtemp, readFile, rm, symlink } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { setupCredentials, readCredentials } from '../../scripts/storage/credentials'

const dirs: string[] = []
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })))
})
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'sineva-storage-test-'))
  dirs.push(root)
  return join(root, 'secrets')
}
it('creates unique random role credentials, restrictive permissions and bucket-scoped identities', async () => {
  const dir = await fixture()
  await setupCredentials(dir)
  expect((await lstat(dir)).mode & 0o777).toBe(0o700)
  const credentials = []
  for (const role of ['bootstrap', 'app', 'backup'] as const) {
    const credential = await readCredentials(dir, role)
    expect(credential.accessKeyId).toMatch(/^[a-f0-9]{32}$/)
    expect(credential.secretAccessKey).toMatch(/^[a-f0-9]{64}$/)
    expect((await lstat(join(dir, `${role}.json`))).mode & 0o777).toBe(0o600)
    credentials.push(credential.accessKeyId, credential.secretAccessKey)
  }
  expect(new Set(credentials).size).toBe(6)
  const config = JSON.parse(await readFile(join(dir, 's3.json'), 'utf8'))
  expect(config.identities.map((i: { name: string }) => i.name)).toEqual([
    'bootstrap',
    'app',
    'backup',
  ])
  expect(config.identities[0].actions).toEqual([
    'Admin:media-public',
    'Admin:media-private',
    'Admin:backups',
  ])
  expect(config.identities[1].actions).toEqual([
    'Read:media-public',
    'Write:media-public',
    'List:media-public',
    'Read:media-private',
    'Write:media-private',
    'List:media-private',
  ])
  expect(config.identities[2].actions).toEqual(['Write:backups'])
})
it('is idempotent and does not silently rotate working keys', async () => {
  const dir = await fixture()
  await setupCredentials(dir)
  const before = await readFile(join(dir, 's3.json'), 'utf8')
  await setupCredentials(dir)
  expect(await readFile(join(dir, 's3.json'), 'utf8')).toBe(before)
})
it('refuses a broad-readable credential instead of using it', async () => {
  const dir = await fixture()
  await setupCredentials(dir)
  await chmod(join(dir, 'app.json'), 0o644)
  await expect(readCredentials(dir, 'app')).rejects.toThrow(/permission/i)
})
it('refuses symlinked credential directories', async () => {
  const dir = await fixture()
  const target = await fixture()
  await setupCredentials(target)
  await symlink(target, dir)
  await expect(setupCredentials(dir)).rejects.toThrow(/directory/i)
})
