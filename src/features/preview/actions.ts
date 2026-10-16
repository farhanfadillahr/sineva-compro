'use server'
import { headers } from 'next/headers'
import { readPayload, toCmsActionState, type CmsActionState } from '../cms/errors'
import { createPreview } from './service.server'

/** Stores the current form state and returns the preview link in `message`. Never revalidates. */
export async function createPreviewAction(
  previous: CmsActionState,
  form: FormData,
): Promise<CmsActionState> {
  void previous
  try {
    const { url } = await createPreview(await headers(), readPayload(form))
    return { status: 'success', message: url, savedAt: Date.now() }
  } catch (error) {
    return toCmsActionState(error)
  }
}
