import 'server-only'
import { readStorageConfig } from '../storage/config'
import { assertPrefix, type MediaStore } from './store'
import { BlobMediaStore } from './blob-store.server'
import { S3MediaStore } from './s3-store.server'
import { db } from '../db/client.server'
import { readServerEnv } from '../../env/server'
import { MediaService } from '../../features/media/service.server'
import { readMediaOrigin } from '../../features/media/query.server'
let shared: MediaStore | undefined
export function mediaStore() {
  if (shared) return shared
  const provider = process.env.MEDIA_PROVIDER ?? 's3'
  const prefix = assertPrefix(
    process.env.MEDIA_PREFIX ?? (process.env.NODE_ENV === 'production' ? '' : 'local'),
  )
  if (provider === 'vercel-blob') {
    if (['local', 'test'].includes(prefix) && process.env.NODE_ENV === 'production')
      throw new Error('Remote media needs a preview or production prefix')
    shared = new BlobMediaStore({ prefix, token: process.env.BLOB_READ_WRITE_TOKEN ?? '' })
    return shared
  }
  if (provider !== 's3') throw new Error('Invalid media provider')
  const storage = readStorageConfig(process.env)
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(new URL(storage.endpoint).hostname)
  if (!local && ['test', 'local'].includes(prefix))
    throw new Error('Remote media needs a preview or production prefix')
  const accessKeyId = process.env.MEDIA_S3_ACCESS_KEY_ID,
    secretAccessKey = process.env.MEDIA_S3_SECRET_ACCESS_KEY
  if (!accessKeyId || !secretAccessKey) throw new Error('Media storage credentials missing')
  shared = new S3MediaStore({
    endpoint: storage.endpoint,
    prefix,
    credentials: { accessKeyId, secretAccessKey },
  })
  return shared
}
export function mediaService() {
  return new MediaService(db, readServerEnv(process.env), mediaStore(), readMediaOrigin())
}
