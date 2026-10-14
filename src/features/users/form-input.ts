import { invalidInput } from './errors'
import {
  parseCreateEditor,
  parseUpdateEditor,
  parseEditorStatus,
  parseEditorPassword,
} from './input'
function fields(form: FormData, allowed: readonly string[]) {
  const result: Record<string, string> = {}
  for (const [key, value] of form.entries()) {
    if (key.startsWith('$ACTION_')) continue
    if (!allowed.includes(key) || typeof value !== 'string' || Object.hasOwn(result, key))
      throw invalidInput()
    result[key] = value
  }
  return result
}
export function readCreateEditorForm(form: FormData) {
  return parseCreateEditor(fields(form, ['name', 'email', 'password']))
}
export function readUpdateEditorForm(form: FormData) {
  return parseUpdateEditor(fields(form, ['userId', 'name', 'email']))
}
export function readEditorPasswordForm(form: FormData) {
  return parseEditorPassword(fields(form, ['userId', 'newPassword']))
}
export function readEditorStatusForm(form: FormData) {
  const data = fields(form, ['userId', 'active'])
  if (data.active !== 'true' && data.active !== 'false') throw invalidInput()
  return parseEditorStatus({ ...data, active: data.active === 'true' })
}
