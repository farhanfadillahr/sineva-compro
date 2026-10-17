'use server'
import { headers } from 'next/headers'
import { toCmsActionState, type CmsActionState } from '../cms/errors'
import { revalidateAdmin } from '../cms/revalidate.server'
import { deleteWaitlistEntry, joinWaitlistEntry, type WaitlistResult } from './service.server'

/** Public server action of the waitlist form (CPR-79 wires it). No public CRUD route exists. */
export async function joinWaitlist(
  input: unknown,
  meta: { locale?: string } = {},
): Promise<WaitlistResult> {
  return joinWaitlistEntry(input, { headers: await headers(), locale: meta.locale })
}

export async function deleteWaitlistEntryAction(previous: CmsActionState, form: FormData) {
  void previous
  try {
    await deleteWaitlistEntry(await headers(), String(form.get('id') ?? ''))
    revalidateAdmin('/admin/waitlist')
    return { status: 'success', message: 'Entri dihapus.', savedAt: Date.now() } as CmsActionState
  } catch (error) {
    return toCmsActionState(error)
  }
}
