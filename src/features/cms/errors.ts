import { AccessDeniedError } from '../auth/access-errors'
import { MediaError } from '../media/metadata'
import type { FieldErrors } from './fields'

/** Expected CMS failures. Anything else is reported as a generic error and logged by Next. */
export class CmsError extends Error {
  constructor(
    readonly code: 'INVALID' | 'NOT_FOUND' | 'CONFLICT',
    message: string,
    readonly errors: FieldErrors = {},
  ) {
    super(message)
    this.name = 'CmsError'
  }
}

export type CmsActionState = {
  status: 'idle' | 'success' | 'error'
  message: string
  errors?: FieldErrors
  /** Set when a create redirects the editor to the new record. */
  id?: string
  /** Increments on every save so the client can react to two identical results in a row. */
  savedAt?: number
}

export const idleState: CmsActionState = { status: 'idle', message: '' }

/** Maps an error to a safe state for the form. Unknown errors never leak details. */
export function toCmsActionState(error: unknown): CmsActionState {
  if (error instanceof CmsError)
    return { status: 'error', message: error.message, errors: error.errors }
  if (error instanceof AccessDeniedError)
    return {
      status: 'error',
      message:
        error.code === 'UNAUTHORIZED'
          ? 'Sesi Anda berakhir. Masuk kembali untuk menyimpan.'
          : 'Anda tidak memiliki akses untuk perubahan ini.',
    }
  // Media failures carry Indonesian messages already and no sensitive data.
  if (error instanceof MediaError) return { status: 'error', message: error.message }
  console.error('CMS mutation failed.', error instanceof Error ? error.name : typeof error)
  return { status: 'error', message: 'Perubahan belum dapat disimpan. Coba kembali.' }
}

const MAX_PAYLOAD = 1_000_000

/** Reads the JSON payload a CMS form submits in its hidden `payload` field. */
export function readPayload(form: FormData, key = 'payload'): unknown {
  const raw = form.get(key)
  if (typeof raw !== 'string' || !raw || raw.length > MAX_PAYLOAD)
    throw new CmsError('INVALID', 'Data formulir tidak valid.')
  try {
    return JSON.parse(raw)
  } catch {
    throw new CmsError('INVALID', 'Data formulir tidak valid.')
  }
}
