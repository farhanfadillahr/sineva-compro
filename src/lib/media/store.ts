export type MediaBucket = 'private' | 'public'
export type MediaLocation = { bucket: MediaBucket; key: string }
export type StoredHead = { size: number; contentType: string }
export interface MediaStore {
  readonly prefix: string
  put(input: MediaLocation & { body: Buffer; contentType: string }): Promise<void>
  get(input: MediaLocation): Promise<(StoredHead & { body: Buffer }) | null>
  head(input: MediaLocation): Promise<StoredHead | null>
  delete(input: MediaLocation): Promise<void>
  list(bucket: MediaBucket, prefix: string): Promise<string[]>
  copy(source: MediaLocation, target: MediaLocation): Promise<void>
  presign(
    input: MediaLocation,
    method: 'GET' | 'PUT',
    expires?: number,
    contentType?: string,
  ): Promise<string>
}
export function assertPrefix(value: string) {
  if (!/^(?:local|test|production|preview-[a-z0-9][a-z0-9-]{0,47})$/.test(value))
    throw new Error('Invalid media environment prefix')
  return value
}
export function assertMediaKey(prefix: string, key: string) {
  if (
    !key.startsWith(`${prefix}/`) ||
    key.length > 350 ||
    !/^[a-zA-Z0-9_./-]+$/.test(key) ||
    key.split('/').some((part) => part === '..' || part === '.')
  )
    throw new Error('Media key outside environment')
}
