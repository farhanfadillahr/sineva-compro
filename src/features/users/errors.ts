import { AccessDeniedError } from '../auth/access-errors'
import type { UsersErrorCode } from './types'
export class UsersServiceError extends Error {
  constructor(
    public readonly code: UsersErrorCode,
    message: string,
    public readonly fieldErrors?: Record<string, string>,
  ) {
    super(message)
  }
}
export function invalidInput() {
  return new UsersServiceError('VALIDATION', 'Periksa kembali data yang Anda masukkan.')
}
export function safeUsersError(error: unknown): UsersServiceError | AccessDeniedError {
  if (error instanceof UsersServiceError || error instanceof AccessDeniedError) return error
  let current: unknown = error
  for (let depth = 0; depth < 5 && current && typeof current === 'object'; depth++) {
    const data = current as { code?: unknown; body?: { code?: unknown }; cause?: unknown }
    if (data.code === '23505' || data.body?.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL')
      return new UsersServiceError('CONFLICT', 'Email sudah digunakan. Gunakan email lain.')
    current = data.cause
  }
  return new UsersServiceError('UNAVAILABLE', 'Perubahan belum dapat disimpan. Coba lagi.')
}

export function toUserActionState(error: unknown): import('./types').UserActionState {
  const safe = safeUsersError(error)
  return {
    status: 'error',
    message:
      safe instanceof AccessDeniedError
        ? 'Anda tidak memiliki akses untuk tindakan ini.'
        : safe.message,
  }
}
