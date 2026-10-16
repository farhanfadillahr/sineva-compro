'use server'
import { headers } from 'next/headers'
import { CmsError, readPayload, toCmsActionState, type CmsActionState } from '../cms/errors'
import { revalidateAdmin } from '../cms/revalidate.server'
import { documentConfigs, isDocumentName } from './configs'
import { deleteDocument, publishDocument, saveDraft, unpublishDocument } from './service.server'

function documentName(form: FormData) {
  const name = form.get('document')
  if (!isDocumentName(name)) throw new CmsError('INVALID', 'Jenis konten tidak dikenal.')
  return name
}
const done = (message: string, id?: string): CmsActionState => ({
  status: 'success',
  message,
  ...(id ? { id } : {}),
  savedAt: Date.now(),
})

export async function saveDraftAction(previous: CmsActionState, form: FormData) {
  void previous
  try {
    const name = documentName(form)
    const id = await saveDraft(await headers(), name, readPayload(form))
    revalidateAdmin(documentConfigs[name].adminPath)
    return done('Draf disimpan. Versi terbit tidak berubah.', id)
  } catch (error) {
    return toCmsActionState(error)
  }
}

export async function publishDocumentAction(previous: CmsActionState, form: FormData) {
  void previous
  try {
    const name = documentName(form)
    await publishDocument(await headers(), name, String(form.get('id') ?? ''), form.get('locale'))
    revalidateAdmin(documentConfigs[name].adminPath)
    return done('Draf diterbitkan dan sudah tampil di situs.')
  } catch (error) {
    return toCmsActionState(error)
  }
}

export async function unpublishDocumentAction(previous: CmsActionState, form: FormData) {
  void previous
  try {
    const name = documentName(form)
    await unpublishDocument(await headers(), name, String(form.get('id') ?? ''), form.get('locale'))
    revalidateAdmin(documentConfigs[name].adminPath)
    return done('Publikasi dibatalkan. Draf tetap tersimpan.')
  } catch (error) {
    return toCmsActionState(error)
  }
}

export async function deleteDocumentAction(previous: CmsActionState, form: FormData) {
  void previous
  try {
    const name = documentName(form)
    await deleteDocument(await headers(), name, String(form.get('id') ?? ''))
    revalidateAdmin(documentConfigs[name].adminPath)
    return done(`${documentConfigs[name].itemLabel} dihapus.`)
  } catch (error) {
    return toCmsActionState(error)
  }
}
