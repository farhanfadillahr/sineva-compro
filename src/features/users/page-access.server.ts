import 'server-only'
import { notFound, redirect } from 'next/navigation'
import { AccessDeniedError } from '../auth/access-errors'
import { UsersServiceError } from './errors'
export async function readUsersPage<T>(query: () => Promise<T>): Promise<T> {
  try {
    return await query()
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      if (error.code === 'UNAUTHORIZED') redirect('/admin/login')
      notFound()
    }
    if (
      error instanceof UsersServiceError &&
      ['FORBIDDEN', 'NOT_FOUND', 'VALIDATION'].includes(error.code)
    )
      notFound()
    throw error
  }
}
