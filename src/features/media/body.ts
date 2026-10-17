import 'server-only'
import { MediaError } from './metadata'
export async function readBoundedBody(request: Request, maxBytes: number): Promise<Buffer> {
  const tooLarge = () => new MediaError('INVALID', 'Ukuran upload melewati batas.')
  const length = request.headers.get('content-length')
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > maxBytes)) throw tooLarge()
  if (!request.body) return Buffer.alloc(0)
  const reader = request.body.getReader(),
    chunks: Uint8Array[] = []
  let size = 0
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      if (request.signal.aborted) throw new MediaError('INVALID', 'Upload dibatalkan.')
      size += value.byteLength
      if (size > maxBytes) {
        await reader.cancel()
        throw tooLarge()
      }
      chunks.push(value)
    }
    return Buffer.concat(chunks, size)
  } finally {
    reader.releaseLock()
  }
}
