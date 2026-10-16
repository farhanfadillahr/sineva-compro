import 'server-only'
import { readStorageConfig } from '../storage/config'
import { assertPrefix } from './store'
import { S3MediaStore } from './s3-store.server'
import { db } from '../db/client.server'
import { readServerEnv } from '../../env/server'
import { MediaService } from '../../features/media/service.server'
import { readMediaOrigin } from '../../features/media/query.server'
let shared: S3MediaStore | undefined
export function mediaStore() {
  if (shared) return shared
  const storage = readStorageConfig(process.env),
    prefix = assertPrefix(
      process.env.MEDIA_PREFIX ?? (process.env.NODE_ENV === 'production' ? '' : 'local'),
    )
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
