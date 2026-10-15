import { validateBootstrapInput } from '../auth/bootstrap-input'
import { invalidInput } from './errors'
import type {
  CreateEditorInput,
  UpdateEditorInput,
  EditorStatusInput,
  EditorPasswordInput,
  UserListInput,
} from './types'
function requireKeys(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalidInput()
  const data = value as Record<string, unknown>
  if (Object.keys(data).some((k) => !keys.includes(k))) throw invalidInput()
  return data
}
export function parseUserId(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 128) throw invalidInput()
  return value
}
export function parseCreateEditor(input: unknown): CreateEditorInput {
  const data = requireKeys(input, ['name', 'email', 'password'])
  try {
    return validateBootstrapInput(data)
  } catch {
    throw invalidInput()
  }
}
export function parseUpdateEditor(input: unknown): UpdateEditorInput {
  const data = requireKeys(input, ['userId', 'name', 'email'])
  const identity = parseCreateEditor({
    name: data.name,
    email: data.email,
    password: 'identity-only-validation',
  })
  return { userId: parseUserId(data.userId), name: identity.name, email: identity.email }
}
export function parseEditorStatus(input: unknown): EditorStatusInput {
  const data = requireKeys(input, ['userId', 'active'])
  if (typeof data.active !== 'boolean') throw invalidInput()
  return { userId: parseUserId(data.userId), active: data.active }
}
export function parseEditorPassword(input: unknown): EditorPasswordInput {
  const data = requireKeys(input, ['userId', 'newPassword'])
  if (
    typeof data.newPassword !== 'string' ||
    data.newPassword.length < 12 ||
    data.newPassword.length > 128 ||
    !data.newPassword.trim()
  )
    throw invalidInput()
  return { userId: parseUserId(data.userId), newPassword: data.newPassword }
}
export function parseUserList(input: unknown): UserListInput {
  const data = requireKeys(input, ['search', 'page', 'pageSize'])
  const search = data.search ?? ''
  const page = data.page ?? 1
  const pageSize = data.pageSize ?? 20
  if (
    typeof search !== 'string' ||
    search.trim().length > 100 ||
    typeof page !== 'number' ||
    !Number.isInteger(page) ||
    page < 1 ||
    page > 100000 ||
    typeof pageSize !== 'number' ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 50
  )
    throw invalidInput()
  return { search: search.trim(), page, pageSize }
}
