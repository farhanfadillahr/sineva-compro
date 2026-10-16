import 'server-only'
import { db } from '../../lib/db/client.server'
import { readServerEnv } from '../../env/server'
import { loadPrincipal, assertCapability } from '../auth/access.server'
import { AccessDeniedError } from '../auth/access-errors'
import { MediaError } from './metadata'
import { MAX_UPLOAD_BYTES } from './validation'
import { readBoundedBody } from './body'
const privateHeaders = { 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff' }
export function mediaJson(value: unknown, status = 200) {
  return Response.json(value, { status, headers: privateHeaders })
}
export async function guardedMedia(
  request: Request,
  mutating: boolean,
  run: () => Promise<Response>,
) {
  try {
    const env = readServerEnv(process.env)
    assertCapability(await loadPrincipal(db, env, request.headers), 'content:write')
    if (
      mutating &&
      (request.headers.get('origin') !== env.authUrl ||
        request.headers.get('sec-fetch-site') === 'cross-site')
    )
      throw new AccessDeniedError('FORBIDDEN')
    return await run()
  } catch (error) {
    if (error instanceof AccessDeniedError)
      return mediaJson(
        { error: 'Anda tidak memiliki akses media.' },
        error.code === 'UNAUTHORIZED' ? 401 : 403,
      )
    if (error instanceof MediaError)
      return mediaJson(
        { error: error.message, usages: error.usages },
        error.code === 'NOT_FOUND'
          ? 404
          : error.code === 'IN_USE'
            ? 409
            : error.code === 'UNAVAILABLE'
              ? 503
              : 400,
      )
    return mediaJson(
      { error: 'Media belum dapat diproses. Periksa konfigurasi penyimpanan atau coba kembali.' },
      503,
    )
  }
}
export async function readMediaJson(request: Request) {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new MediaError('INVALID', 'Gunakan data JSON.')
  try {
    return JSON.parse((await readBoundedBody(request, 16 * 1024)).toString())
  } catch (error) {
    if (error instanceof MediaError) throw error
    throw new MediaError('INVALID', 'Data JSON tidak valid.')
  }
}
export async function readMediaUpload(request: Request) {
  if (!request.headers.get('content-type')?.startsWith('multipart/form-data;'))
    throw new MediaError('INVALID', 'Gunakan formulir upload.')
  const bytes = await readBoundedBody(request, MAX_UPLOAD_BYTES + 64 * 1024)
  let form: FormData
  try {
    form = await new Request(request.url, {
      method: 'POST',
      headers: { 'content-type': request.headers.get('content-type')! },
      body: new Uint8Array(bytes),
    }).formData()
  } catch {
    throw new MediaError('INVALID', 'Formulir upload tidak valid.')
  }
  if (
    [...form.keys()].some((key) => !['file', 'metadata'].includes(key)) ||
    form.getAll('file').length !== 1 ||
    form.getAll('metadata').length > 1
  )
    throw new MediaError('INVALID', 'Kirim satu file per upload.')
  const file = form.get('file'),
    raw = form.get('metadata')
  if (
    !(file instanceof File) ||
    !file.size ||
    file.size > MAX_UPLOAD_BYTES ||
    (typeof raw !== 'string' && raw !== null) ||
    (typeof raw === 'string' && raw.length > 8192)
  )
    throw new MediaError('INVALID', 'File atau metadata tidak valid.')
  let metadata: unknown
  try {
    metadata = raw === null ? undefined : JSON.parse(raw as string)
  } catch {
    throw new MediaError('INVALID', 'Metadata tidak valid.')
  }
  return {
    body: Buffer.from(await file.arrayBuffer()),
    filename: file.name,
    contentType: file.type,
    metadata,
  }
}
