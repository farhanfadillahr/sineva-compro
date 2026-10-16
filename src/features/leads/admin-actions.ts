'use server'
import { headers } from 'next/headers'
import { readPayload, toCmsActionState, type CmsActionState } from '../cms/errors'
import { revalidateAdmin } from '../cms/revalidate.server'
import { deleteLead, updateLead } from './admin.server'

export async function updateLeadAction(previous: CmsActionState, form: FormData) {
  void previous
  try {
    await updateLead(await headers(), readPayload(form))
    revalidateAdmin('/admin/leads')
    return { status: 'success', message: 'Lead diperbarui.', savedAt: Date.now() } as CmsActionState
  } catch (error) {
    return toCmsActionState(error)
  }
}

export async function deleteLeadAction(previous: CmsActionState, form: FormData) {
  void previous
  try {
    await deleteLead(await headers(), String(form.get('id') ?? ''))
    revalidateAdmin('/admin/leads')
    return { status: 'success', message: 'Lead dihapus.', savedAt: Date.now() } as CmsActionState
  } catch (error) {
    return toCmsActionState(error)
  }
}
