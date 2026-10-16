import {
  assertMediaKey,
  assertPrefix,
  type MediaBucket,
  type MediaLocation,
  type MediaStore,
  type StoredHead,
} from './store'
export class MemoryMediaStore implements MediaStore {
  readonly prefix: string
  private readonly objects = new Map<string, StoredHead & { body: Buffer }>()
  constructor(prefix: string) {
    this.prefix = assertPrefix(prefix)
  }
  private id(input: MediaLocation) {
    assertMediaKey(this.prefix, input.key)
    if (!['private', 'public'].includes(input.bucket)) throw new Error('Invalid bucket')
    return `${input.bucket}:${input.key}`
  }
  async put(input: MediaLocation & { body: Buffer; contentType: string }) {
    this.objects.set(this.id(input), {
      body: Buffer.from(input.body),
      size: input.body.length,
      contentType: input.contentType,
    })
  }
  async get(input: MediaLocation) {
    const row = this.objects.get(this.id(input))
    return row ? { ...row, body: Buffer.from(row.body) } : null
  }
  async head(input: MediaLocation) {
    const row = await this.get(input)
    return row ? { size: row.size, contentType: row.contentType } : null
  }
  async delete(input: MediaLocation) {
    this.objects.delete(this.id(input))
  }
  async list(bucket: MediaBucket, prefix: string) {
    this.id({ bucket, key: prefix })
    return [...this.objects.keys()]
      .filter((key) => key.startsWith(`${bucket}:${prefix}`))
      .map((key) => key.slice(bucket.length + 1))
      .sort()
  }
  async copy(source: MediaLocation, target: MediaLocation) {
    const row = await this.get(source)
    if (!row) throw new Error('Object not found')
    await this.put({ ...target, ...row })
  }
  async presign(input: MediaLocation, method: 'GET' | 'PUT', expires = 120) {
    this.id(input)
    return `https://memory.invalid/${input.bucket}/${input.key}?method=${method}&expires=${expires}`
  }
}
