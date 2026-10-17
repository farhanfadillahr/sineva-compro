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
  name: 'capabilities' | 'businessTypes' | 'faq' | 'team' | 'categories'
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
  /** Field shown as the item title in lists (locale data first, then language-independent). */
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

export const FAQ_BASE_TAGS = [
  { value: 'home', label: 'Beranda' },
  { value: 'product', label: 'Produk' },
  { value: 'services', label: 'Ringkasan layanan' },
] as const

export const faqConfig: CollectionConfig = {
  name: 'faq',
  adminPath: '/admin/faq',
  title: 'FAQ',
  itemLabel: 'Pertanyaan',
  description:
    'Satu pustaka FAQ untuk Beranda, Produk, Layanan dan tiap layanan. Tag menentukan tempat tampil; urutan berlaku di semua tag.',
  formHint: 'Jawaban tidak boleh memuat klaim yang belum terverifikasi.',
  keyLabel: 'Kunci',
  audit: 'faq',
  mediaEntity: 'pages',
  titleField: 'question',
  globalSchema: f.object({
    tags: f.tags('Tampil di', FAQ_BASE_TAGS, 20, {
      min: 1,
      pattern: 'service:[a-z0-9]+(?:-[a-z0-9]+)*',
      optionsKey: 'serviceTags',
      hint: 'Pilih satu atau lebih halaman.',
    }),
  }),
  localeSchema: f.object({
    question: f.required('Pertanyaan', 160),
    answer: f.richText('Jawaban', {
      profile: 'answer',
      hint: 'Paragraf dan daftar dengan tebal, miring atau tautan.',
    }),
  }),
}

export const teamConfig: CollectionConfig = {
  name: 'team',
  adminPath: '/admin/team',
  title: 'Tim dan penulis',
  itemLabel: 'Anggota tim',
  description:
    'Anggota tampil di halaman Tentang bila diaktifkan, dan dapat dipilih sebagai penulis artikel.',
  formHint: 'Tampilkan anggota di situs hanya setelah orang tersebut setuju.',
  keyLabel: 'Kunci',
  audit: 'team',
  mediaEntity: 'team',
  titleField: 'name',
  auditNames: { socialUrl: 'social' },
  globalSchema: f.object({
    name: f.required('Nama', 80),
    photo: f.media('Foto', 'Persegi, minimal 400 × 400 px.'),
    socialUrl: f.optional('Tautan sosial', 300, { format: 'url', publicCopy: false }),
    showOnAbout: f.boolean('Tampilkan di halaman Tentang'),
  }),
  localeSchema: f.object({
    role: f.required('Jabatan', 80),
    bio: f.optional('Bio singkat', 300, { multiline: true }),
  }),
}

export const categoriesConfig: CollectionConfig = {
  name: 'categories',
  adminPath: '/admin/blog/categories',
  title: 'Kategori artikel',
  itemLabel: 'Kategori',
  description: 'Filter blog memakai kunci kategori: /blog?category=<kunci>.',
  keyLabel: 'Slug',
  audit: 'categories',
  mediaEntity: 'posts',
  titleField: 'name',
  auditNames: { key: 'slug' },
  globalSchema: f.object({}),
  localeSchema: f.object({ name: f.required('Nama', 40) }),
}

export const collectionConfigs = {
  capabilities: capabilitiesConfig,
  businessTypes: businessTypesConfig,
  faq: faqConfig,
  team: teamConfig,
  categories: categoriesConfig,
} as const satisfies Record<CollectionConfig['name'], CollectionConfig>

export type CollectionName = keyof typeof collectionConfigs

/** Keys are stable identifiers (kebab-case), not database ids. */
export const keyField = f.required('Kunci', 80, {
  format: 'slug',
  publicCopy: false,
  hint: 'Huruf kecil, angka dan tanda hubung. Tidak dapat diubah setelah dibuat.',
})
