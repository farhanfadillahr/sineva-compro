'use server'
import { headers } from 'next/headers'
import { readPayload, toCmsActionState, type CmsActionState } from '../cms/errors'
import { revalidateAdmin } from '../cms/revalidate.server'
import { updateLead } from './admin.server'

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
