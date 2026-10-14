export class LoginInputError extends Error {
  constructor(public readonly status: 400 | 413) {
    super('Invalid login request')
  }
}
export async function normalizeLoginRequest(
  request: Request,
): Promise<{ email: string; request: Request }> {
  if (
    request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json'
  )
    throw new LoginInputError(400)
  const reader = request.body?.getReader()
  if (!reader) throw new LoginInputError(400)
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    for (;;) {
      const next = await reader.read()
      if (next.done) break
      size += next.value.byteLength
      if (size > 8192) {
        await reader.cancel()
        throw new LoginInputError(413)
      }
      chunks.push(next.value)
    }
  } finally {
    reader.releaseLock()
  }
  const buffer = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    buffer.set(chunk, offset)
    offset += chunk.length
  }
  let input: unknown
  try {
    input = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer))
  } catch {
    throw new LoginInputError(400)
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new LoginInputError(400)
  const data = input as Record<string, unknown>
  if (
    Object.keys(data).some(
      (k) => !['email', 'password', 'rememberMe', 'callbackURL'].includes(k),
    ) ||
    typeof data.email !== 'string' ||
    typeof data.password !== 'string'
  )
    throw new LoginInputError(400)
  const email = data.email.trim().toLowerCase()
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !data.password.length ||
    data.password.length > 128 ||
    (data.rememberMe !== undefined && typeof data.rememberMe !== 'boolean') ||
    (data.callbackURL !== undefined &&
      (typeof data.callbackURL !== 'string' || data.callbackURL.length > 2048))
  )
    throw new LoginInputError(400)
  const headers = new Headers(request.headers)
  headers.delete('content-length')
  return {
    email,
    request: new Request(request.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...data, email }),
    }),
  }
}
