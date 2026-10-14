export type UserSummary = {
  id: string
  name: string
  email: string
  role: 'admin' | 'editor'
  active: boolean
}
export type UserListInput = { search: string; page: number; pageSize: number }
export type UserPage = { users: UserSummary[]; total: number; page: number; pageSize: number }
export type CreateEditorInput = { name: string; email: string; password: string }
export type UpdateEditorInput = { userId: string; name: string; email: string }
export type EditorStatusInput = { userId: string; active: boolean }
export type EditorPasswordInput = { userId: string; newPassword: string }
export type UsersErrorCode =
  'UNAUTHORIZED' | 'FORBIDDEN' | 'VALIDATION' | 'NOT_FOUND' | 'CONFLICT' | 'UNAVAILABLE'
export type UserActionState = {
  status: 'idle' | 'success' | 'error'
  message: string
  fieldErrors?: Record<string, string>
  userId?: string
}
