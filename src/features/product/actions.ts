'use server'
import { headers } from 'next/headers'
import { readPayload, toCmsActionState, type CmsActionState } from '../cms/errors'
import { revalidateAdmin } from '../cms/revalidate.server'
import { saveProductStatus } from './service.server'

export async function saveProductStatusAction(
  previous: CmsActionState,
  form: FormData,
): Promise<CmsActionState> {
  void previous
  try {
    const payload = readPayload(form) as { status?: unknown }
    await saveProductStatus(await headers(), payload?.status)
    revalidateAdmin('/admin/product')
    return {
      status: 'success',
      message:
        payload.status === 'live'
          ? 'Produk ditandai tersedia. Tombol situs beralih ke "coba".'
          : 'Produk ditandai segera hadir. Tombol situs beralih ke waitlist.',
      savedAt: Date.now(),
    }
  } catch (error) {
    return toCmsActionState(error)
  }
}
