/**
 * Publishable documents edited in the admin (posts, work). Pure module: the descriptor renders
 * the editor and validates drafts (partially) and publication (fully).
 */
import type { AuditEntity } from '../audit/input'
import { gradientOptions, poseField } from '../cms/choices'
import { f, type ObjectField } from '../cms/fields'
import { seoSchema } from '../cms/seo-fields'
import type { MediaOwner } from '../media/types'

export type DocumentName = 'posts' | 'work'

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
  /**
   * Drops values the chosen options make irrelevant, before the data is stored or its media
   * references are counted. Runs on parsed data only.
   */
  normalize?: (data: Record<string, unknown>) => Record<string, unknown>
}>

/**
 * A post cover keeps every field so switching back restores it in the form, but the image only
 * counts while "Gambar dari pustaka media" is chosen. Otherwise a cover switched to the kit (or
 * none) kept its image in `media_usage`, and that image could never be deleted (CPR-113).
 */
export function dropUnusedCoverMedia(data: Record<string, unknown>): Record<string, unknown> {
  const cover = data.cover
  if (typeof cover !== 'object' || cover === null) return data
  const { kind, media } = cover as { kind?: unknown; media?: unknown }
  if (kind === 'media' || media === null || media === undefined) return data
  return { ...data, cover: { ...cover, media: null } }
}

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
  normalize: dropUnusedCoverMedia,
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

export const workConfig: DocumentConfig = {
  name: 'work',
  adminPath: '/admin/work',
  publicPrefix: '/work/',
  title: 'Karya',
  itemLabel: 'Karya',
  description: 'Proyek demo internal dan proyek klien. Draf tersimpan terpisah dari versi terbit.',
  formHint:
    'Tulis hanya hasil yang nyata dan sudah terverifikasi. Jangan mengarang angka, klien atau testimoni.',
  audit: 'portfolio',
  mediaEntity: 'portfolio',
  schema: f.object({
    title: f.required('Judul', 120),
    projectType: f.select(
      'Jenis proyek',
      [
        { value: 'internal-demo', label: 'Proyek demo internal' },
        { value: 'client', label: 'Proyek klien' },
      ],
      { hint: 'Proyek demo internal tampil dengan label "Internal demo project".' },
    ),
    summary: f.required('Ringkasan', 300, { multiline: true }),
    cover: f.media('Sampul'),
    challenge: f.required('Tantangan', 1200, { multiline: true }),
    solution: f.required('Solusi', 1200, { multiline: true }),
    result: f.required('Hasil', 1200, {
      multiline: true,
      hint: 'Hanya hasil nyata yang sudah terverifikasi.',
    }),
    stack: f.list('Teknologi', f.required('Teknologi', 40), 12, { itemLabel: 'Teknologi' }),
    gallery: f.list('Galeri', f.media('Gambar'), 8, { itemLabel: 'Gambar' }),
    demoUrl: f.optional('URL demo', 300, { format: 'url', publicCopy: false }),
    serviceSlug: f.select('Layanan terkait', [], {
      nullable: true,
      optionsKey: 'services',
      pattern: SLUG_PATTERN,
    }),
    featured: f.boolean('Tampilkan di "Selected work" Beranda'),
    seo: seoSchema,
  }),
}

export const documentConfigs = { posts: postsConfig, work: workConfig } as const satisfies Record<
  DocumentName,
  DocumentConfig
>

export function isDocumentName(value: unknown): value is DocumentName {
  return typeof value === 'string' && Object.hasOwn(documentConfigs, value)
}
