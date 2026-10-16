'use server'
import { headers } from 'next/headers'
import { readPayload, toCmsActionState, type CmsActionState } from '../cms/errors'
import { revalidateAdmin } from '../cms/revalidate.server'
import { saveEmailSettings, sendTestEmail } from './service.server'

export async function saveEmailSettingsAction(previous: CmsActionState, form: FormData) {
  void previous
  try {
    await saveEmailSettings(await headers(), readPayload(form))
    revalidateAdmin('/admin/settings/email')
    return {
      status: 'success',
      message: 'Pengaturan email disimpan.',
      savedAt: Date.now(),
    } as CmsActionState
  } catch (error) {
    return toCmsActionState(error)
  }
}

export async function sendTestEmailAction(previous: CmsActionState, form: FormData) {
  void previous
  void form
  try {
    const result = await sendTestEmail(await headers())
    return {
      status: result.ok ? 'success' : 'error',
      message: `${result.provider}: ${result.detail}`,
      savedAt: Date.now(),
    } as CmsActionState
  } catch (error) {
    return toCmsActionState(error)
  }
}
