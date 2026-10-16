import assert from 'node:assert/strict'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  UploadPartCommand,
  type S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { StorageConfig } from '../../src/lib/storage/config'
import { storageClient } from './client'

type Check = { operation: string; bucket?: string; status: 'PASS' | 'FAIL' }
/** Real network checks. Object cleanup uses an exact in-memory ledger, never bucket wipes. */
export async function runCompatibility(config: StorageConfig, directory: string) {
  const clients: S3Client[] = []
  const checks: Check[] = []
  const prefix = `compat/${randomUUID()}/`
  const sentinel = `compat-sentinel/${randomUUID()}`
  const objects = new Map<string, { Bucket: string; Key: string }>()
  const uploads: { Bucket: string; Key: string; UploadId: string }[] = []
  const remember = (Bucket: string, Key: string) => {
    assert(Key.startsWith(prefix) || Key === sentinel, 'Refusing cleanup outside own objects')
    const params = { Bucket, Key }
    objects.set(`${Bucket}/${Key}`, params)
    return params
  }
  async function check(operation: string, run: () => Promise<void>, bucket?: string) {
    try {
      await run()
      checks.push({ operation, bucket, status: 'PASS' })
    } catch {
      checks.push({ operation, bucket, status: 'FAIL' })
    }
  }
  async function denied(run: () => Promise<unknown>) {
    try {
      await run()
    } catch (error) {
      assert.equal(
        (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode,
        403,
      )
      return
    }
    assert.fail('Expected access denial')
  }
  const hash = (body: Uint8Array) => createHash('sha256').update(body).digest('hex')
  const http = (url: string, init?: RequestInit) =>
    fetch(url, { ...init, redirect: 'manual', signal: AbortSignal.timeout(15000) })
  try {
    const admin = await storageClient(config, directory, 'bootstrap')
    clients.push(admin)
    const app = await storageClient(config, directory, 'app')
    clients.push(app)
    const backup = await storageClient(config, directory, 'backup')
    clients.push(backup)
    const sentinelParams = remember('media-private', sentinel)
    await admin.send(new PutObjectCommand({ ...sentinelParams, Body: 'preserve-me' }))
    for (const Bucket of ['media-public', 'media-private']) {
      const params = remember(Bucket, `${prefix}object.txt`)
      const body = `Sineva compatibility ${randomUUID()}`
      const cache =
        Bucket === 'media-public' ? 'public, max-age=31536000, immutable' : 'private, no-store'
      await check(
        'PutObject',
        async () => {
          await app.send(
            new PutObjectCommand({
              ...params,
              Body: body,
              ContentType: 'text/plain',
              CacheControl: cache,
            }),
          )
        },
        Bucket,
      )
      await check(
        'GetObject',
        async () => {
          const result = await app.send(new GetObjectCommand(params))
          assert.equal(await result.Body?.transformToString(), body)
          assert.equal(result.CacheControl, cache)
        },
        Bucket,
      )
      await check(
        'HeadObject',
        async () => {
          const result = await app.send(new HeadObjectCommand(params))
          assert.equal(result.ContentLength, Buffer.byteLength(body))
          assert.equal(result.ContentType, 'text/plain')
        },
        Bucket,
      )
      await check(
        'ListObjectsV2',
        async () => {
          const result = await app.send(new ListObjectsV2Command({ Bucket, Prefix: prefix }))
          assert(result.Contents)
          assert(result.Contents.some((o) => o.Key === params.Key))
          assert(result.Contents.every((o) => o.Key?.startsWith(prefix)))
        },
        Bucket,
      )
      await check(
        'presigned GET',
        async () => {
          const signed = await getSignedUrl(app, new GetObjectCommand(params), { expiresIn: 60 })
          const response = await http(signed)
          assert.equal(response.status, 200)
          assert.equal(await response.text(), body)
        },
        Bucket,
      )
      await check(
        'presigned PUT',
        async () => {
          const put = remember(Bucket, `${prefix}presigned.txt`)
          const signed = await getSignedUrl(
            app,
            new PutObjectCommand({ ...put, Body: 'presigned-body' }),
            { expiresIn: 60 },
          )
          const response = await http(signed, { method: 'PUT', body: 'presigned-body' })
          assert.equal(response.status, 200)
          await response.body?.cancel()
          const result = await app.send(new GetObjectCommand(put))
          assert.equal(await result.Body?.transformToString(), 'presigned-body')
        },
        Bucket,
      )
      await check(
        'multipart 6 MiB',
        async () => {
          const multipart = remember(Bucket, `${prefix}multipart.bin`)
          const body = randomBytes(6 * 1024 * 1024)
          const created = await app.send(new CreateMultipartUploadCommand(multipart))
          assert(created.UploadId)
          const upload = { ...multipart, UploadId: created.UploadId }
          uploads.push(upload)
          const parts = []
          for (const [index, part] of [
            body.subarray(0, 5 * 1024 * 1024),
            body.subarray(5 * 1024 * 1024),
          ].entries()) {
            const result = await app.send(
              new UploadPartCommand({ ...upload, PartNumber: index + 1, Body: part }),
            )
            assert(result.ETag)
            parts.push({ PartNumber: index + 1, ETag: result.ETag })
          }
          await app.send(
            new CompleteMultipartUploadCommand({ ...upload, MultipartUpload: { Parts: parts } }),
          )
          uploads.splice(uploads.indexOf(upload), 1)
          const result = await app.send(new GetObjectCommand(multipart))
          assert(result.Body)
          assert.equal(hash(await result.Body.transformToByteArray()), hash(body))
        },
        Bucket,
      )
      await check(
        'DeleteObject',
        async () => {
          await app.send(new DeleteObjectCommand(params))
          await assert.rejects(
            app.send(new HeadObjectCommand(params)),
            (error: { $metadata?: { httpStatusCode?: number } }) =>
              error.$metadata?.httpStatusCode === 404,
          )
        },
        Bucket,
      )
    }
    const backupParams = remember('backups', `${prefix}backup.txt`)
    await check('backup write only', async () => {
      await backup.send(new PutObjectCommand({ ...backupParams, Body: 'backup-fixture' }))
      const result = await admin.send(new GetObjectCommand(backupParams))
      assert.equal(await result.Body?.transformToString(), 'backup-fixture')
      await denied(() => backup.send(new GetObjectCommand(backupParams)))
      await denied(() =>
        backup.send(new ListObjectsV2Command({ Bucket: 'backups', Prefix: prefix })),
      )
    })
    for (const [operation, Bucket, Key] of [
      ['anonymous private denial', 'media-private', sentinel],
      ['anonymous backups denial', 'backups', backupParams.Key],
    ]) {
      await check(operation, async () => {
        const response = await http(`${config.endpoint}/${Bucket}/${Key}`)
        assert([403, 404].includes(response.status))
        await response.body?.cancel()
      })
    }
    await check('app denied backups', async () => {
      await denied(() =>
        app.send(
          new PutObjectCommand({
            ...remember('backups', `${prefix}forbidden-app`),
            Body: 'forbidden-fixture',
          }),
        ),
      )
      await denied(() => app.send(new GetObjectCommand(backupParams)))
      await denied(() => app.send(new HeadObjectCommand(backupParams)))
      await denied(() => app.send(new DeleteObjectCommand(backupParams)))
      await denied(() => app.send(new ListObjectsV2Command({ Bucket: 'backups', Prefix: prefix })))
    })
    await check('backup denied media', async () => {
      for (const Bucket of ['media-public', 'media-private']) {
        await denied(() =>
          backup.send(
            new PutObjectCommand({
              ...remember(Bucket, `${prefix}forbidden-backup`),
              Body: 'forbidden-fixture',
            }),
          ),
        )
        await denied(() =>
          backup.send(
            new GetObjectCommand({
              Bucket,
              Key: Bucket === 'media-private' ? sentinel : `${prefix}presigned.txt`,
            }),
          ),
        )
        const existing = {
          Bucket,
          Key: Bucket === 'media-private' ? sentinel : `${prefix}presigned.txt`,
        }
        await denied(() => backup.send(new HeadObjectCommand(existing)))
        await denied(() => backup.send(new DeleteObjectCommand(existing)))
        await denied(() => backup.send(new ListObjectsV2Command({ Bucket, Prefix: prefix })))
      }
    })
    await check('cleanup own prefix', async () => {
      for (const object of objects.values())
        if (object.Key.startsWith(prefix)) await admin.send(new DeleteObjectCommand(object))
      for (const Bucket of config.buckets) {
        const list = await admin.send(new ListObjectsV2Command({ Bucket, Prefix: prefix }))
        assert.equal(list.Contents?.length ?? 0, 0)
        await admin.send(new HeadBucketCommand({ Bucket }))
      }
    })
    await check('unrelated object preserved', async () => {
      const result = await admin.send(new GetObjectCommand(sentinelParams))
      assert.equal(await result.Body?.transformToString(), 'preserve-me')
    })
  } finally {
    const admin = clients[0]
    if (admin) {
      await check('final cleanup', async () => {
        const cleanup = await Promise.allSettled([
          ...uploads.map((u) => admin.send(new AbortMultipartUploadCommand(u))),
          ...[...objects.values()].map((o) => admin.send(new DeleteObjectCommand(o))),
        ])
        assert(cleanup.every((r) => r.status === 'fulfilled'))
      })
    }
    for (const client of clients) client.destroy()
  }
  return { prefix, endpoint: config.endpoint, checks }
}
