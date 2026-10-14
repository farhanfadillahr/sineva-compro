'use server'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { db } from '../../lib/db/client.server'
import { readServerEnv } from '../../env/server'
import { createEditor, updateEditor, setEditorActive, changeEditorPassword } from './service.server'
import {
  readCreateEditorForm,
  readUpdateEditorForm,
  readEditorStatusForm,
  readEditorPasswordForm,
} from './form-input'
import { toUserActionState } from './errors'
import type { UserActionState } from './types'
export async function createEditorAction(
  previous: UserActionState,
  form: FormData,
): Promise<UserActionState> {
  void previous
  try {
    const editor = await createEditor(
      db,
      readServerEnv(process.env),
      await headers(),
      readCreateEditorForm(form),
    )
    revalidatePath('/admin/users')
    return { status: 'success', message: 'Akun Editor berhasil dibuat.', userId: editor.id }
  } catch (error) {
    return toUserActionState(error)
  }
}
export async function updateEditorAction(
  previous: UserActionState,
  form: FormData,
): Promise<UserActionState> {
  void previous
  try {
    const editor = await updateEditor(
      db,
      readServerEnv(process.env),
      await headers(),
      readUpdateEditorForm(form),
    )
    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${encodeURIComponent(editor.id)}`)
    return { status: 'success', message: 'Data Editor berhasil disimpan.' }
  } catch (error) {
    return toUserActionState(error)
  }
}
export async function setEditorActiveAction(
  previous: UserActionState,
  form: FormData,
): Promise<UserActionState> {
  void previous
  try {
    const input = readEditorStatusForm(form)
    await setEditorActive(db, readServerEnv(process.env), await headers(), input)
    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${encodeURIComponent(input.userId)}`)
    return {
      status: 'success',
      message: input.active ? 'Akun Editor diaktifkan.' : 'Akun Editor dinonaktifkan.',
    }
  } catch (error) {
    return toUserActionState(error)
  }
}
export async function changeEditorPasswordAction(
  previous: UserActionState,
  form: FormData,
): Promise<UserActionState> {
  void previous
  try {
    const input = readEditorPasswordForm(form)
    await changeEditorPassword(db, readServerEnv(process.env), await headers(), input)
    revalidatePath(`/admin/users/${encodeURIComponent(input.userId)}`)
    return { status: 'success', message: 'Password diganti. Editor perlu masuk kembali.' }
  } catch (error) {
    return toUserActionState(error)
  }
}
