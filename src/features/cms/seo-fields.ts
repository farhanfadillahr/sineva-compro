import { FIELD_LIMITS } from '../content/limits'
import { f } from './fields'

/**
 * Per-document SEO (CMS plan section 2.4). Editors write the title and description; the canonical
 * override and noindex are Admin only. Empty OG image falls back to the generated card.
 */
export const seoSchema = f.object(
  {
    metaTitle: f.required('Judul meta', FIELD_LIMITS.metaTitleChars),
    metaDescription: f.required('Deskripsi meta', FIELD_LIMITS.metaDescriptionChars, {
      multiline: true,
    }),
    ogImage: f.media('Gambar OG', 'Kosongkan untuk kartu otomatis. Ukuran 1200 × 630 px.'),
    canonicalUrl: f.optional('URL kanonis', 300, {
      format: 'url',
      publicCopy: false,
      adminOnly: true,
      hint: 'Lanjutan. Kosongkan untuk memakai URL halaman ini.',
    }),
    noindex: { ...f.boolean('Jangan indeks halaman ini'), adminOnly: true },
  },
  { label: 'SEO' },
)
