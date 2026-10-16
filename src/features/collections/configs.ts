/**
 * Ordered collections edited in the admin. Pure module: the descriptors render the admin forms,
 * validate the server actions and convert the static launch content for the seed.
 */
import type { AuditEntity } from '../audit/input'
import { poseField, tintOptions } from '../cms/choices'
import { f, type ObjectField } from '../cms/fields'
import { FIELD_LIMITS } from '../content/limits'
import type { MediaOwner } from '../media/types'

export type CollectionItem = {
  id: string
  key: string
  sortOrder: number
  isDemo: boolean
  global: Record<string, unknown>
  locales: Record<string, Record<string, unknown> | undefined>
  updatedAt: string
}

export type CollectionConfig = Readonly<{
  /** Registry name, also the table prefix. */
  name: 'capabilities' | 'businessTypes'
  /** Admin URL of the list, for redirects and revalidation. */
  adminPath: string
  title: string
  itemLabel: string
  description: string
  /** Helper text shown on the form. */
  formHint?: string
  keyLabel: string
  audit: AuditEntity
  /** Media owner entity for media fields in this collection. */
  mediaEntity: MediaOwner['entity']
  globalSchema: ObjectField
  localeSchema: ObjectField
  /** Field shown as the item title in lists. */
  titleField: string
  /** Map from a descriptor key to its audit field name, when they differ. */
  auditNames?: Readonly<Record<string, string>>
}>

export const capabilitiesConfig: CollectionConfig = {
  name: 'capabilities',
  adminPath: '/admin/product',
  title: 'Kemampuan produk',
  itemLabel: 'Kemampuan',
  description: 'Kartu permintaan untuk Sino di Beranda dan halaman Produk.',
  formHint:
    'Hanya terbitkan kemampuan yang sudah dikonfirmasi tim CBT. Jangan menjanjikan kanal atau integrasi yang belum pasti.',
  keyLabel: 'Kunci',
  audit: 'product',
  mediaEntity: 'product',
  titleField: 'title',
  globalSchema: f.object({
    tint: f.select('Warna kartu', tintOptions),
    pose: poseField(),
    featured: f.boolean('Unggulan', 'Kemampuan unggulan tampil lebih dulu di Beranda.'),
  }),
  localeSchema: f.object({
    title: f.required('Judul (permintaan kepada Sino)', 90, {
      hint: 'Tulis sebagai permintaan, misalnya "Sino, reply to today\'s customer chats".',
    }),
    body: f.required('Isi', 300, { multiline: true }),
    mockupLines: f.list('Baris mockup', f.required('Baris', 80), FIELD_LIMITS.mockupLines, {
      itemLabel: 'Baris',
    }),
  }),
}

export const businessTypesConfig: CollectionConfig = {
  name: 'businessTypes',
  adminPath: '/admin/product',
  title: 'Jenis bisnis',
  itemLabel: 'Jenis bisnis',
  description: 'Tab "Made for your business" di halaman Produk.',
  formHint:
    'Ini daftar industri untuk tab produk. Segmen pada formulir kontak dan waitlist adalah daftar tetap di kode.',
  keyLabel: 'Kunci',
  audit: 'product',
  mediaEntity: 'product',
  titleField: 'label',
  globalSchema: f.object({}),
  localeSchema: f.object({
    label: f.required('Label tab', 40),
    exampleDay: f.required('Contoh satu hari', 300, { multiline: true }),
  }),
}

export const collectionConfigs = {
  capabilities: capabilitiesConfig,
  businessTypes: businessTypesConfig,
} as const satisfies Record<CollectionConfig['name'], CollectionConfig>

export type CollectionName = keyof typeof collectionConfigs

/** Keys are stable identifiers (kebab-case), not database ids. */
export const keyField = f.required('Kunci', 80, {
  format: 'slug',
  publicCopy: false,
  hint: 'Huruf kecil, angka dan tanda hubung. Tidak dapat diubah setelah dibuat.',
})
