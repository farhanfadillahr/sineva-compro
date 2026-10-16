import { S3Client } from '@aws-sdk/client-s3'
import type { StorageConfig } from '../../src/lib/storage/config'
import { readCredentials } from './credentials'

export async function storageClient(
  config: StorageConfig,
  directory: string,
  role: 'bootstrap' | 'app' | 'backup',
) {
  return new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: config.forcePathStyle,
    credentials: await readCredentials(directory, role),
    maxAttempts: 1,
    requestHandler: { connectionTimeout: 3000, requestTimeout: 15000 },
  })
}
