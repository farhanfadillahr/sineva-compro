import { randomBytes } from 'node:crypto'
import { constants } from 'node:fs'
import { lstat, mkdir, open, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

type Role = 'bootstrap' | 'app' | 'backup'
const roles: Role[] = ['bootstrap', 'app', 'backup']
type Credential = { accessKeyId: string; secretAccessKey: string }

async function checkDirectory(directory: string) {
  const stat = await lstat(directory)
  if (
    !stat.isDirectory() ||
    stat.isSymbolicLink() ||
    (stat.mode & 0o777) !== 0o700 ||
    stat.uid !== process.getuid?.()
  ) {
    throw new Error('Storage credential directory must be owned by this user with permissions 0700')
  }
}
async function readPrivateJson(file: string): Promise<unknown> {
  const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const stat = await handle.stat()
    if (!stat.isFile() || (stat.mode & 0o777) !== 0o600 || stat.uid !== process.getuid?.()) {
      throw new Error('Storage credential file permissions must be owner-only 0600')
    }
    return JSON.parse(await handle.readFile('utf8'))
  } finally {
    await handle.close()
  }
}
export async function readCredentials(directory: string, role: Role): Promise<Credential> {
  await checkDirectory(directory)
  const value = (await readPrivateJson(join(directory, `${role}.json`))) as Partial<Credential>
  if (
    !/^[a-f0-9]{32}$/.test(value.accessKeyId ?? '') ||
    !/^[a-f0-9]{64}$/.test(value.secretAccessKey ?? '')
  ) {
    throw new Error('Invalid storage credential file')
  }
  return value as Credential
}
export async function setupCredentials(directory: string): Promise<void> {
  try {
    await mkdir(directory, { mode: 0o700 })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
    await checkDirectory(directory)
    for (const role of roles) await readCredentials(directory, role)
    await readPrivateJson(join(directory, 's3.json'))
    return
  }
  const actions = {
    bootstrap: ['Admin:media-public', 'Admin:media-private', 'Admin:backups'],
    app: [
      'Read:media-public',
      'Write:media-public',
      'List:media-public',
      'Read:media-private',
      'Write:media-private',
      'List:media-private',
    ],
    backup: ['Write:backups'],
  }
  const identities = []
  for (const role of roles) {
    const credential = {
      accessKeyId: randomBytes(16).toString('hex'),
      secretAccessKey: randomBytes(32).toString('hex'),
    }
    await writeFile(join(directory, `${role}.json`), JSON.stringify(credential) + '\n', {
      mode: 0o600,
      flag: 'wx',
    })
    identities.push({
      name: role,
      credentials: [{ accessKey: credential.accessKeyId, secretKey: credential.secretAccessKey }],
      actions: actions[role],
    })
  }
  await writeFile(join(directory, 's3.json'), JSON.stringify({ identities }, null, 2) + '\n', {
    mode: 0o600,
    flag: 'wx',
  })
}
