import 'server-only'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  assertMediaKey,
  assertPrefix,
  type MediaBucket,
  type MediaLocation,
  type MediaStore,
} from './store'
type Options = {
  endpoint: string
  prefix: string
  credentials: { accessKeyId: string; secretAccessKey: string }
}
const bucketNames = { private: 'media-private', public: 'media-public' } as const
const PART = 5 * 1024 * 1024
export class S3MediaStore implements MediaStore {
  readonly prefix: string
  private readonly client: S3Client
  constructor(options: Options) {
    this.prefix = assertPrefix(options.prefix)
    this.client = new S3Client({
      endpoint: options.endpoint,
      region: 'us-east-1',
      forcePathStyle: true,
      credentials: options.credentials,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    })
  }
  private input(location: MediaLocation) {
    assertMediaKey(this.prefix, location.key)
    if (!Object.hasOwn(bucketNames, location.bucket)) throw new Error('Invalid media bucket')
    return { Bucket: bucketNames[location.bucket], Key: location.key }
  }
  private missing(error: unknown) {
    return (
      !!error &&
      typeof error === 'object' &&
      ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404 ||
        ['NoSuchKey', 'NotFound'].includes((error as Error).name))
    )
  }
  async put(input: MediaLocation & { body: Buffer; contentType: string }) {
    const base = { ...this.input(input), ContentType: input.contentType }
    if (input.body.length <= PART) {
      await this.client.send(
        new PutObjectCommand({ ...base, Body: input.body, ContentLength: input.body.length }),
      )
      return
    }
    const started = await this.client.send(new CreateMultipartUploadCommand(base))
    if (!started.UploadId) throw new Error('Missing multipart upload ID')
    const target = { ...this.input(input), UploadId: started.UploadId }
    try {
      const Parts = []
      for (let start = 0, part = 1; start < input.body.length; start += PART, part++) {
        const body = input.body.subarray(start, start + PART),
          result = await this.client.send(
            new UploadPartCommand({
              ...target,
              PartNumber: part,
              Body: body,
              ContentLength: body.length,
            }),
          )
        if (!result.ETag) throw new Error('Multipart part missing ETag')
        Parts.push({ PartNumber: part, ETag: result.ETag })
      }
      await this.client.send(
        new CompleteMultipartUploadCommand({ ...target, MultipartUpload: { Parts } }),
      )
    } catch (error) {
      try {
        await this.client.send(new AbortMultipartUploadCommand(target))
      } catch {}
      throw error
    }
  }
  async get(input: MediaLocation) {
    try {
      const row = await this.client.send(new GetObjectCommand(this.input(input)))
      if (!row.Body) return null
      const body = Buffer.from(await row.Body.transformToByteArray())
      return { body, size: body.length, contentType: row.ContentType ?? 'application/octet-stream' }
    } catch (error) {
      if (this.missing(error)) return null
      throw error
    }
  }
  async head(input: MediaLocation) {
    try {
      const row = await this.client.send(new HeadObjectCommand(this.input(input)))
      return {
        size: row.ContentLength ?? 0,
        contentType: row.ContentType ?? 'application/octet-stream',
      }
    } catch (error) {
      if (this.missing(error)) return null
      throw error
    }
  }
  async delete(input: MediaLocation) {
    await this.client.send(new DeleteObjectCommand(this.input(input)))
  }
  async list(bucket: MediaBucket, prefix: string) {
    this.input({ bucket, key: prefix })
    const keys: string[] = []
    let token: string | undefined
    do {
      const row = await this.client.send(
        new ListObjectsV2Command({
          Bucket: bucketNames[bucket],
          Prefix: prefix,
          ContinuationToken: token,
        }),
      )
      for (const item of row.Contents ?? [])
        if (item.Key) {
          assertMediaKey(this.prefix, item.Key)
          keys.push(item.Key)
        }
      if (row.IsTruncated && !row.NextContinuationToken)
        throw new Error('Truncated storage listing')
      token = row.IsTruncated ? row.NextContinuationToken : undefined
    } while (token)
    return keys.sort()
  }
  async copy(source: MediaLocation, target: MediaLocation) {
    const from = this.input(source)
    await this.client.send(
      new CopyObjectCommand({
        ...this.input(target),
        CopySource: `${from.Bucket}/${source.key.split('/').map(encodeURIComponent).join('/')}`,
      }),
    )
  }
  async presign(input: MediaLocation, method: 'GET' | 'PUT', expires = 120, contentType?: string) {
    const target = this.input(input)
    if (!['GET', 'PUT'].includes(method)) throw new Error('Invalid signed method')
    return getSignedUrl(
      this.client,
      method === 'GET'
        ? new GetObjectCommand(target)
        : new PutObjectCommand({ ...target, ContentType: contentType }),
      {
        expiresIn: Math.max(1, Math.min(300, expires)),
        ...(method === 'PUT' && contentType ? { signableHeaders: new Set(['content-type']) } : {}),
      },
    )
  }
  close() {
    this.client.destroy()
  }
}
