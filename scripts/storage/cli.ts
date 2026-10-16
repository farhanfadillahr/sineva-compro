import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { readStorageConfig } from '../../src/lib/storage/config'
import { bootstrapBuckets } from './bootstrap'
import { runCompatibility } from './compatibility'
import { setupCredentials } from './credentials'

try {
  // Guard before any filesystem mutation, credential loading, or network request.
  const config = readStorageConfig(process.env)
  const directory = resolve(process.env.STORAGE_CREDENTIALS_DIR ?? '.storage/secrets')
  switch (process.argv[2]) {
    case 'setup':
      await mkdir(resolve(directory, '..'), { recursive: true, mode: 0o700 })
      await setupCredentials(directory)
      await writeFile(
        resolve(directory, '..', 'compose.env'),
        `STORAGE_UID=${process.getuid?.()}\nSTORAGE_GID=${process.getgid?.()}\n`,
        { mode: 0o600 },
      )
      console.log('Local storage credentials ready (values are never printed).')
      break
    case 'bootstrap':
      console.log(JSON.stringify(await bootstrapBuckets(config, directory), null, 2))
      break
    case 'check': {
      const result = await runCompatibility(config, directory)
      console.log(JSON.stringify(result, null, 2))
      if (result.checks.some((r) => r.status === 'FAIL')) process.exitCode = 1
      break
    }
    default:
      throw new Error('Unknown storage command')
  }
} catch {
  // SDK exceptions may include authorization or a presigned URL. Do not log them.
  console.error(
    'Storage command failed. Check target guard, private credential permissions, and local service readiness. No credentials or signed URLs are logged.',
  )
  process.exitCode = 1
}
