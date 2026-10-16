import { expect, it } from 'vitest'
import { bootstrapBuckets } from '../../scripts/storage/bootstrap'
import { runCompatibility } from '../../scripts/storage/compatibility'
import { readStorageConfig } from '../../src/lib/storage/config'

it('bootstraps twice and proves real S3 operations and isolation, cleaning only its own prefix', async () => {
  const config = readStorageConfig(process.env)
  const directory = process.env.STORAGE_CREDENTIALS_DIR ?? '.storage/secrets'
  const first = await bootstrapBuckets(config, directory)
  const second = await bootstrapBuckets(config, directory)
  expect(first.map((r) => r.bucket)).toEqual(['media-public', 'media-private', 'backups'])
  expect(second.map((r) => r.status)).toEqual(['exists', 'exists', 'exists'])
  const result = await runCompatibility(config, directory)
  expect(result.checks.map((r) => r.operation)).toEqual(
    expect.arrayContaining([
      'PutObject',
      'GetObject',
      'DeleteObject',
      'HeadObject',
      'ListObjectsV2',
      'presigned GET',
      'presigned PUT',
      'multipart 6 MiB',
      'anonymous private denial',
      'anonymous backups denial',
      'app denied backups',
      'backup denied media',
      'backup write only',
      'cleanup own prefix',
      'unrelated object preserved',
    ]),
  )
  expect(result.checks.every((r) => r.status === 'PASS')).toBe(true)
})
