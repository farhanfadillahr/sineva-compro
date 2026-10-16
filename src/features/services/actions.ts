'use server'
import { headers } from 'next/headers'
import { readPayload, toCmsActionState, type CmsActionState } from '../cms/errors'
import { revalidateAdmin } from '../cms/revalidate.server'
import { deleteService, reorderServices, saveService, setServicePublished } from './service.server'

const done = (message: string, id?: string): CmsActionState => ({
  status: 'success',
  message,
  ...(id ? { id } : {}),
  savedAt: Date.now(),
})

export async function saveServiceAction(previous: CmsActionState, form: FormData) {
  void previous
  try {
    const id = await saveService(await headers(), readPayload(form))
    revalidateAdmin('/admin/services')
    return done('Layanan disimpan.', id)
  } catch (error) {
    return toCmsActionState(error)
  }
}

export async function publishServiceAction(previous: CmsActionState, form: FormData) {
  void previous
  try {
    const published = form.get('published') === 'true'
    await setServicePublished(await headers(), String(form.get('id') ?? ''), published)
    revalidateAdmin('/admin/services')
    return done(published ? 'Layanan diterbitkan.' : 'Publikasi layanan dibatalkan.')
  } catch (error) {
    return toCmsActionState(error)
  }
}

export async function reorderServicesAction(previous: CmsActionState, form: FormData) {
  void previous
  try {
    await reorderServices(await headers(), readPayload(form))
    revalidateAdmin('/admin/services')
    return done('Urutan disimpan.')
  } catch (error) {
    return toCmsActionState(error)
  }
}

export async function deleteServiceAction(previous: CmsActionState, form: FormData) {
  void previous
  try {
    await deleteService(await headers(), String(form.get('id') ?? ''))
    revalidateAdmin('/admin/services')
    return done('Layanan dihapus.')
  } catch (error) {
    return toCmsActionState(error)
  }
}
