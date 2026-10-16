/**
 * Publishable documents edited in the admin (posts, work). Pure module: the descriptor renders
 * the editor and validates drafts (partially) and publication (fully).
 */
import type { AuditEntity } from '../audit/input'
import { gradientOptions, poseField } from '../cms/choices'
import { f, type ObjectField } from '../cms/fields'
import { seoSchema } from '../cms/seo-fields'
import type { MediaOwner } from '../media/types'

export type DocumentName = 'posts'

export type DocumentConfig = Readonly<{
  name: DocumentName
  adminPath: string
  /** Public path prefix, for the slug input and redirects. */
  publicPrefix: string
  title: string
  itemLabel: string
  description: string
  formHint?: string
  audit: Extract<AuditEntity, 'posts' | 'portfolio'>
  mediaEntity: Extract<MediaOwner['entity'], 'posts' | 'portfolio'>
  schema: ObjectField
}>

export type DocumentItem = {
  id: string
  sortOrder: number
  isDemo: boolean
  updatedAt: string
  locales: Record<
    string,
    | {
        draftSlug: string
        draft: Record<string, unknown>
        draftUpdatedAt: string
        publishedSlug: string | null
        published: Record<string, unknown> | null
        firstPublishedAt: string | null
        lastPublishedAt: string | null
      }
    | undefined
  >
}

const UUID_PATTERN = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const SLUG_PATTERN = '[a-z0-9]+(?:-[a-z0-9]+)*'

export const documentSlugField = f.required('Slug', 100, {
  format: 'slug',
  publicCopy: false,
  hint: 'Huruf kecil, angka dan tanda hubung. Mengubah slug yang sudah terbit membuat redirect 301.',
})

export const postsConfig: DocumentConfig = {
  name: 'posts',
  adminPath: '/admin/blog',
  publicPrefix: '/blog/',
  title: 'Artikel',
  itemLabel: 'Artikel',
  description: 'Draf tersimpan terpisah dari versi terbit. Situs hanya menampilkan versi terbit.',
  audit: 'posts',
  mediaEntity: 'posts',
  schema: f.object({
    title: f.required('Judul', 120),
    excerpt: f.required('Ringkasan', 300, { multiline: true }),
    cover: f.object(
      {
        kind: f.select('Jenis sampul', [
          { value: 'none', label: 'Tanpa sampul' },
          { value: 'cover-kit', label: 'Kit sampul (pose Sino dan gradien)' },
          { value: 'media', label: 'Gambar dari pustaka media' },
        ]),
        media: f.media('Gambar sampul'),
        pose: poseField(),
        gradient: f.select('Gradien', gradientOptions),
      },
      { label: 'Sampul' },
    ),
    categorySlug: f.select('Kategori', [], {
      nullable: true,
      optionsKey: 'categories',
      pattern: SLUG_PATTERN,
    }),
    authorId: f.select('Penulis (anggota tim)', [], {
      nullable: true,
      optionsKey: 'authors',
      pattern: UUID_PATTERN,
      hint: 'Kosongkan untuk memakai nama byline di bawah.',
    }),
    bylineName: f.optional('Nama byline tanpa anggota tim', 80, {
      hint: 'Misalnya "Sineva team". Kosongkan untuk tanpa penulis.',
    }),
    publishDate: f.optional('Tanggal terbit tampil', 10, {
      format: 'date',
      publicCopy: false,
      hint: 'Kosongkan untuk memakai waktu terbit pertama.',
    }),
    body: f.richText('Isi artikel'),
    seo: seoSchema,
  }),
}

export const documentConfigs = { posts: postsConfig } as const satisfies Record<
  DocumentName,
  DocumentConfig
>

export function isDocumentName(value: unknown): value is DocumentName {
  return typeof value === 'string' && Object.hasOwn(documentConfigs, value)
}
