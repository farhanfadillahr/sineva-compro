import { CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3'
import type { StorageConfig } from '../../src/lib/storage/config'
import { storageClient } from './client'

/** Add missing buckets only. Never change ACLs, policies, or delete existing data. */
export async function bootstrapBuckets(config: StorageConfig, directory: string) {
  const client = await storageClient(config, directory, 'bootstrap')
  const results: { bucket: string; status: 'created' | 'exists' }[] = []
  try {
    for (const bucket of config.buckets) {
      try {
        await client.send(new HeadBucketCommand({ Bucket: bucket }))
        results.push({ bucket, status: 'exists' })
      } catch (error) {
        if (
          (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode !== 404
        )
          throw error
        try {
          await client.send(new CreateBucketCommand({ Bucket: bucket }))
          results.push({ bucket, status: 'created' })
        } catch (createError) {
          if ((createError as Error).name !== 'BucketAlreadyOwnedByYou') throw createError
          await client.send(new HeadBucketCommand({ Bucket: bucket }))
          results.push({ bucket, status: 'exists' })
        }
      }
    }
    return results
  } finally {
    client.destroy()
  }
}
