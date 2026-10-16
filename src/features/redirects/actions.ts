'use server'
import { headers } from 'next/headers'
import { readPayload, toCmsActionState, type CmsActionState } from '../cms/errors'
import { revalidateAdmin } from '../cms/revalidate.server'
import { createRedirect, deleteRedirect } from './service.server'

export async function createRedirectAction(previous: CmsActionState, form: FormData) {
  void previous
  try {
    await createRedirect(await headers(), readPayload(form))
    revalidateAdmin('/admin/redirects')
    return {
      status: 'success',
      message: 'Redirect ditambahkan.',
      savedAt: Date.now(),
    } as CmsActionState
  } catch (error) {
    return toCmsActionState(error)
  }
}

export async function deleteRedirectAction(previous: CmsActionState, form: FormData) {
  void previous
  try {
    await deleteRedirect(await headers(), String(form.get('id') ?? ''))
    revalidateAdmin('/admin/redirects')
    return {
      status: 'success',
      message: 'Redirect dihapus.',
      savedAt: Date.now(),
    } as CmsActionState
  } catch (error) {
    return toCmsActionState(error)
  }
}
