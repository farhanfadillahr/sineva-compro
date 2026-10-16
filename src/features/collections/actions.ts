'use server'
import { headers } from 'next/headers'
import { CmsError, readPayload, toCmsActionState, type CmsActionState } from '../cms/errors'
import { revalidateAdmin } from '../cms/revalidate.server'
import { collectionConfigs } from './configs'
import { isCollectionName } from './registry'
import { deleteCollectionItem, reorderCollection, saveCollectionItem } from './service.server'

function collection(form: FormData) {
  const name = form.get('collection')
  if (!isCollectionName(name)) throw new CmsError('INVALID', 'Koleksi tidak dikenal.')
  return name
}

export async function saveCollectionItemAction(
  previous: CmsActionState,
  form: FormData,
): Promise<CmsActionState> {
  void previous
  try {
    const name = collection(form)
    const id = await saveCollectionItem(await headers(), name, readPayload(form))
    revalidateAdmin(collectionConfigs[name].adminPath)
    return {
      status: 'success',
      message: `${collectionConfigs[name].itemLabel} disimpan dan sudah tampil di situs.`,
      id,
      savedAt: Date.now(),
    }
  } catch (error) {
    return toCmsActionState(error)
  }
}

export async function deleteCollectionItemAction(
  previous: CmsActionState,
  form: FormData,
): Promise<CmsActionState> {
  void previous
  try {
    const name = collection(form)
    await deleteCollectionItem(await headers(), name, String(form.get('id') ?? ''))
    revalidateAdmin(collectionConfigs[name].adminPath)
    return {
      status: 'success',
      message: `${collectionConfigs[name].itemLabel} dihapus.`,
      savedAt: Date.now(),
    }
  } catch (error) {
    return toCmsActionState(error)
  }
}

export async function reorderCollectionAction(
  previous: CmsActionState,
  form: FormData,
): Promise<CmsActionState> {
  void previous
  try {
    const name = collection(form)
    await reorderCollection(await headers(), name, readPayload(form))
    revalidateAdmin(collectionConfigs[name].adminPath)
    return { status: 'success', message: 'Urutan disimpan.', savedAt: Date.now() }
  } catch (error) {
    return toCmsActionState(error)
  }
}
