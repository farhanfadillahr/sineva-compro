'use server'
import { headers } from 'next/headers'
import { readPayload, toCmsActionState, type CmsActionState } from '../cms/errors'
import { revalidateAdmin } from '../cms/revalidate.server'
import { changePassword, revokeSessions, savePreferences, updateName } from './service.server'

const ok = (message: string): CmsActionState => ({
  status: 'success',
  message,
  savedAt: Date.now(),
})

export async function updateNameAction(previous: CmsActionState, form: FormData) {
  void previous
  try {
    await updateName(await headers(), readPayload(form))
    revalidateAdmin('/admin/profil')
    return ok('Nama disimpan.')
  } catch (error) {
    return toCmsActionState(error)
  }
}

export async function changePasswordAction(previous: CmsActionState, form: FormData) {
  void previous
  try {
    await changePassword(await headers(), readPayload(form))
    revalidateAdmin('/admin/profil')
    return ok('Password diganti. Sesi di perangkat lain sudah dikeluarkan.')
  } catch (error) {
    return toCmsActionState(error)
  }
}

export async function revokeSessionsAction(previous: CmsActionState, form: FormData) {
  void previous
  try {
    const count = await revokeSessions(await headers(), readPayload(form))
    revalidateAdmin('/admin/profil')
    return ok(count === 1 ? 'Sesi dikeluarkan.' : `${count} sesi dikeluarkan.`)
  } catch (error) {
    return toCmsActionState(error)
  }
}

export async function savePreferencesAction(previous: CmsActionState, form: FormData) {
  void previous
  try {
    await savePreferences(await headers(), readPayload(form))
    revalidateAdmin('/admin')
    return ok('Preferensi disimpan.')
  } catch (error) {
    return toCmsActionState(error)
  }
}
