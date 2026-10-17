'use server'
import { headers } from 'next/headers'
import { PAGE_KEYS, type PageKey } from '../content/types'
import { CmsError, readPayload, toCmsActionState, type CmsActionState } from '../cms/errors'
import { revalidateAdmin } from '../cms/revalidate.server'
import { savePage } from './service.server'

function pageKey(form: FormData): PageKey {
  const key = form.get('pageKey')
  if (typeof key !== 'string' || !(PAGE_KEYS as readonly string[]).includes(key))
    throw new CmsError('INVALID', 'Halaman tidak dikenal.')
  return key as PageKey
}

export async function savePageAction(
  previous: CmsActionState,
  form: FormData,
): Promise<CmsActionState> {
  void previous
  try {
    await savePage(await headers(), pageKey(form), readPayload(form))
    revalidateAdmin('/admin/pages')
    return {
      status: 'success',
      message: 'Halaman disimpan dan sudah tampil di situs.',
      savedAt: Date.now(),
    }
  } catch (error) {
    return toCmsActionState(error)
  }
}
