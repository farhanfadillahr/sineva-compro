'use server'
import { headers } from 'next/headers'
import { readPayload, toCmsActionState, type CmsActionState } from '../cms/errors'
import { revalidateAdmin } from '../cms/revalidate.server'
import { SITE_FORM_GLOBAL_GROUPS, SITE_FORM_LOCALE_GROUPS } from './fields'
import { saveSiteSettings } from './service.server'

export async function saveSiteSettingsAction(
  previous: CmsActionState,
  form: FormData,
): Promise<CmsActionState> {
  void previous
  try {
    await saveSiteSettings(await headers(), readPayload(form), {
      global: SITE_FORM_GLOBAL_GROUPS,
      locale: SITE_FORM_LOCALE_GROUPS,
    })
    revalidateAdmin('/admin/settings')
    return { status: 'success', message: 'Pengaturan situs disimpan.', savedAt: Date.now() }
  } catch (error) {
    return toCmsActionState(error)
  }
}
