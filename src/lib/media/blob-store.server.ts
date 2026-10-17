import 'server-only'
import {
  BlobNotFoundError,
  copy,
  del,
  get,
  head,
  issueSignedToken,
  list,
  presignUrl,
  put,
} from '@vercel/blob'
import {
  assertMediaKey,
  assertPrefix,
  type MediaBucket,
  type MediaLocation,
  type MediaStore,
} from './store'

type Options = { prefix: string; token: string }

/** One private Blob store. Public files are served only through the published-media route;
 * keeping separate namespaces preserves draft/public promotion and immutable delivery keys. */
export class BlobMediaStore implements MediaStore {
  readonly prefix: string
  private readonly token: string
  constructor(options: Options) {
    this.prefix = assertPrefix(options.prefix)
    if (!options.token) throw new Error('Vercel Blob credentials missing')
    this.token = options.token
  }
  private path(location: MediaLocation) {
    assertMediaKey(this.prefix, location.key)
    if (!['private', 'public'].includes(location.bucket)) throw new Error('Invalid media bucket')
    return `${location.bucket}/${location.key}`
  }
  async put(input: MediaLocation & { body: Buffer; contentType: string }) {
    await put(this.path(input), input.body, {
      token: this.token,
      access: 'private',
      contentType: input.contentType,
      addRandomSuffix: false,
      allowOverwrite: false,
      multipart: input.body.length > 5 * 1024 * 1024,
    })
  }
  async get(input: MediaLocation) {
    const row = await get(this.path(input), {
      token: this.token,
      access: 'private',
      useCache: false,
    })
    if (!row) return null
    if (row.statusCode !== 200) throw new Error('Unexpected conditional Blob response')
    const body = Buffer.from(await new Response(row.stream).arrayBuffer())
    return { body, size: body.length, contentType: row.blob.contentType }
  }
  async head(input: MediaLocation) {
    const pathname = this.path(input)
    try {
      const row = await head(pathname, { token: this.token })
      return { size: row.size, contentType: row.contentType }
    } catch (error) {
      if (error instanceof BlobNotFoundError) return null
      throw error
    }
  }
  async delete(input: MediaLocation) {
    await del(this.path(input), { token: this.token })
  }
  async list(bucket: MediaBucket, prefix: string) {
    const pathname = this.path({ bucket, key: prefix })
    const keys: string[] = []
    let cursor: string | undefined
    do {
      const row = await list({ token: this.token, prefix: pathname, cursor })
      for (const blob of row.blobs) {
        if (!blob.pathname.startsWith(`${bucket}/`)) throw new Error('Unexpected Blob bucket')
        const key = blob.pathname.slice(bucket.length + 1)
        assertMediaKey(this.prefix, key)
        if (!key.startsWith(prefix)) throw new Error('Unexpected Blob prefix')
        keys.push(key)
      }
      if (row.hasMore && (!row.cursor || row.cursor === cursor))
        throw new Error('Truncated Blob listing')
      cursor = row.hasMore ? row.cursor : undefined
    } while (cursor)
    return keys.sort()
  }
  async copy(source: MediaLocation, target: MediaLocation) {
    const from = this.path(source),
      to = this.path(target)
    const metadata = await this.head(source)
    if (!metadata) throw new Error('Object not found')
    await copy(from, to, {
      token: this.token,
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: metadata.contentType,
    })
  }
  async presign(input: MediaLocation, method: 'GET' | 'PUT', expires = 120, contentType?: string) {
    const pathname = this.path(input)
    if (!['GET', 'PUT'].includes(method)) throw new Error('Invalid signed method')
    const operation = method === 'GET' ? 'get' : 'put'
    const validUntil = Date.now() + Math.max(1, Math.min(300, expires)) * 1000
    const constraints =
      method === 'PUT' && contentType ? { allowedContentTypes: [contentType] } : {}
    const signed = await issueSignedToken({
      token: this.token,
      pathname,
      operations: [operation],
      validUntil,
      ...constraints,
    })
    const { presignedUrl } = await presignUrl(signed, {
      access: 'private',
      operation,
      pathname,
      validUntil,
      ...constraints,
    })
    return presignedUrl
  }
}
