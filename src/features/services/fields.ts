/**
 * Service descriptors (CPR-27). The summary is the card's "who it is for" line (it starts with
 * "For ..."), which the Services list shows; FAQs come from the shared library through
 * `service:<slug>` tags (CPR-84), so the service form has no FAQ field.
 */
import { iconField, poseField } from '../cms/choices'
import { f } from '../cms/fields'
import { seoSchema } from '../cms/seo-fields'
import { FIELD_LIMITS } from '../content/limits'

export const serviceSlugField = f.required('Slug', 80, {
  format: 'slug',
  publicCopy: false,
  hint: 'Alamat halaman: /services/<slug>. Huruf kecil, angka dan tanda hubung.',
})

export const serviceGlobalSchema = f.object(
  {
    icon: iconField(),
    pose: poseField(),
    tools: f.list('Alat dan metode', f.required('Alat', 40), 12, {
      itemLabel: 'Alat',
      hint: 'Tidak diterjemahkan: nama alat ditulis apa adanya.',
    }),
  },
  { label: 'Tampilan' },
)

const step = f.object({
  title: f.required('Judul', 80),
  body: f.required('Isi', 300, { multiline: true }),
})

export const serviceLocaleSchema = f.object(
  {
    title: f.required('Nama layanan', 60),
    summary: f.required('Ringkasan (untuk siapa)', 200, {
      multiline: true,
      hint: 'Diawali "For ...": baris "untuk siapa" pada kartu layanan.',
    }),
    problems: f.list('Masalah yang diselesaikan', step, 4, { min: 3, itemLabel: 'Masalah' }),
    deliverables: f.list('Hasil kerja', f.required('Hasil', 120), 8, {
      min: 1,
      itemLabel: 'Hasil',
    }),
    process: f.list('Proses', step, 6, { min: 1, itemLabel: 'Langkah' }),
    ctaLabel: f.required('Label CTA', 40, { maxWords: FIELD_LIMITS.ctaLabelWordsMax }),
    seo: seoSchema,
  },
  { label: 'Konten' },
)
