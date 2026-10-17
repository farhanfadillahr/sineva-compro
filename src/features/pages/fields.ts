/**
 * Page content descriptors (CMS plan section 2.2, CPR-82). One descriptor per page, mirroring the
 * DTOs in `src/features/content/types.ts` minus `key` and `locale`. Sections are fixed in code and
 * listed in page order (page-patterns.md section 2); the editor changes the text inside them and the
 * `visible` switch of optional sections. No page builder: sections cannot be added or reordered.
 *
 * Every page's static launch content must pass its descriptor (tests/unit/pages-fields.test.ts),
 * which is what keeps the JSONB documents and the code from drifting apart.
 */
import { FIELD_LIMITS } from '../content/limits'
import type { PageKey } from '../content/types'
import { iconField, poseField } from '../cms/choices'
import { f, type FieldSchema, type ObjectField } from '../cms/fields'
import { seoSchema } from '../cms/seo-fields'

const L = FIELD_LIMITS
const headline = (label = 'Judul') => f.required(label, 90, { maxWords: L.heroHeadlineWords })
const title = (label = 'Judul') => f.required(label, 80)
const body = (label = 'Isi') => f.required(label, 400, { multiline: true })
const cta = (label: string) => f.required(label, 40, { maxWords: L.ctaLabelWordsMax })
const optionalCta = (label: string) => f.optional(label, 40, { maxWords: L.ctaLabelWordsMax })
const eyebrow = () => f.optional('Eyebrow', 40, { maxWords: L.eyebrowWords })

const hero = (extra: Record<string, FieldSchema> = {}) =>
  f.object(
    {
      eyebrow: eyebrow(),
      headline: headline(),
      lead: body('Paragraf pembuka'),
      primaryCtaLabel: cta('Label CTA utama'),
      ...extra,
    },
    { label: 'Hero' },
  )
const sectionIntro = (label: string) =>
  f.object({ title: title(), intro: f.optional('Pengantar', 300, { multiline: true }) }, { label })
const steps = (label: string, max = 6) =>
  f.object(
    {
      title: title(),
      steps: f.list('Langkah', f.object({ title: title(), body: body() }), max, {
        itemLabel: 'Langkah',
      }),
    },
    { label },
  )
const iconCards = () =>
  f.list('Kartu', f.object({ title: title(), body: body(), icon: iconField() }), 6, {
    itemLabel: 'Kartu',
  })
const finalCta = (extra: Record<string, FieldSchema> = {}) =>
  f.object(
    {
      headline: headline(),
      body: body(),
      primaryCtaLabel: cta('Label CTA utama'),
      secondaryCtaLabel: optionalCta('Label CTA kedua'),
      ...extra,
    },
    { label: 'CTA penutup' },
  )
const toggleable = (label: string, fields: Record<string, FieldSchema>) =>
  f.object({ visible: f.boolean('Tampilkan'), ...fields }, { label, collapsible: true })
const linkTargets = [
  { value: 'home', label: 'Beranda' },
  { value: 'product', label: 'Produk' },
  { value: 'services', label: 'Layanan' },
  { value: 'work', label: 'Karya' },
  { value: 'blog', label: 'Blog' },
  { value: 'about', label: 'Tentang' },
  { value: 'contact', label: 'Kontak' },
] as const
const links = (label: string, max: number) =>
  f.list(
    label,
    f.object({ label: cta('Label tautan'), target: f.select('Tujuan', linkTargets) }),
    max,
    { itemLabel: 'Tautan' },
  )
const pathCard = (label: string) =>
  f.object(
    {
      eyebrow: eyebrow(),
      title: title(),
      body: body(),
      ctaLabel: cta('Label CTA'),
      pose: poseField(),
    },
    { label },
  )
const emptyStatePage = {
  title: title(),
  intro: body('Pengantar'),
  emptyState: body('Teks saat kosong'),
}

export const pageSchemas = {
  home: f.object({
    hero: hero({
      secondaryCtaLabel: optionalCta('Label CTA kedua'),
      poster: f.media('Poster Sino', 'Gambar diam yang tampil sebelum Sino 3D dimuat.'),
    }),
    twoPaths: f.object(
      { product: pathCard('Kartu produk'), services: pathCard('Kartu layanan') },
      { label: 'Dua jalur' },
    ),
    meetSino: f.object({ title: title(), body: body() }, { label: 'Kenali Sino' }),
    capabilities: sectionIntro('Kemampuan (kartu dari Produk)'),
    howWeWork: steps('Cara kami bekerja'),
    whoWeHelp: f.object({ title: title(), cards: iconCards() }, { label: 'Siapa yang kami bantu' }),
    selectedWork: toggleable('Karya pilihan', {
      title: title(),
      intro: f.optional('Pengantar', 300, { multiline: true }),
    }),
    fromBlog: toggleable('Dari blog', { title: title() }),
    faq: sectionIntro('FAQ (pertanyaan dari pustaka FAQ)'),
    finalCta: finalCta({ whatsappCtaLabel: cta('Label CTA WhatsApp') }),
    seo: seoSchema,
  }),
  product: f.object({
    productStatus: f.select('Status produk', [
      { value: 'coming_soon', label: 'Segera hadir (waitlist)' },
      { value: 'live', label: 'Tersedia (coba sekarang)' },
    ]),
    hero: hero({
      waitlistIntro: body('Pengantar formulir waitlist'),
      mockup: f.object(
        {
          bubbles: f.list(
            'Gelembung chat',
            f.object({
              from: f.select('Pengirim', [
                { value: 'user', label: 'Pengguna' },
                { value: 'sino', label: 'Sino' },
              ]),
              text: f.required('Teks', 80),
            }),
            L.mockupBubbles,
            { itemLabel: 'Gelembung' },
          ),
          chips: f.list('Chip melayang', f.required('Teks chip', 30), L.mockupChips, {
            itemLabel: 'Chip',
          }),
        },
        { label: 'Isi layar ponsel' },
      ),
    }),
    capabilities: sectionIntro('Kemampuan (kartu dari Produk)'),
    howItWorks: steps('Cara kerja'),
    madeForYou: sectionIntro('Dibuat untuk bisnis Anda (tab dari Jenis bisnis)'),
    control: f.object(
      { title: title(), features: iconCards() },
      { label: 'Anda tetap memegang kendali' },
    ),
    comparison: toggleable('Perbandingan', {
      title: title(),
      columns: f.list('Kolom', f.required('Kolom', 40), 4, { itemLabel: 'Kolom' }),
      rows: f.list(
        'Baris',
        f.object({
          label: f.required('Label', 80),
          cells: f.list('Sel', f.required('Sel', 80), 4, { itemLabel: 'Sel' }),
        }),
        10,
        { itemLabel: 'Baris' },
      ),
    }),
    faq: sectionIntro('FAQ (pertanyaan dari pustaka FAQ)'),
    finalCta: finalCta(),
    seo: seoSchema,
  }),
  servicesOverview: f.object({
    hero: hero(),
    servicesIntro: f.object({ title: title(), body: body() }, { label: 'Pengantar layanan' }),
    howWeWork: steps('Cara kami bekerja'),
    whoWeHelp: f.object({ title: title(), cards: iconCards() }, { label: 'Siapa yang kami bantu' }),
    selectedWork: toggleable('Karya pilihan', {
      title: title(),
      intro: f.optional('Pengantar', 300, { multiline: true }),
    }),
    faq: sectionIntro('FAQ (pertanyaan dari pustaka FAQ)'),
    finalCta: finalCta(),
    seo: seoSchema,
  }),
  about: f.object({
    hero: f.object(
      { title: headline(), lead: body('Paragraf pembuka'), scene: f.media('Gambar adegan') },
      { label: 'Hero' },
    ),
    story: f.richText('Cerita'),
    mission: f.object({ title: title(), body: body() }, { label: 'Misi' }),
    values: f.object(
      {
        title: title(),
        items: f.list('Nilai', f.object({ title: title(), body: body() }), 6, {
          itemLabel: 'Nilai',
        }),
      },
      { label: 'Nilai' },
    ),
    meetSino: f.object({ title: title(), body: body() }, { label: 'Kenali Sino' }),
    team: toggleable('Tim (anggota dari koleksi Tim)', { title: title() }),
    finalCta: finalCta(),
    seo: seoSchema,
  }),
  contact: f.object({
    metaChips: f.list('Chip meta', f.required('Teks chip', 40), L.contactChips, {
      itemLabel: 'Chip',
    }),
    headline: headline(),
    lead: body('Paragraf pembuka'),
    steps: f.list('Langkah', f.object({ title: title(), body: body() }), 3, {
      itemLabel: 'Langkah',
    }),
    responseTimeText: f.optional('Teks waktu respons', 160, {
      hint: 'Isi hanya bila SLA sudah disetujui Founder.',
    }),
    form: f.object(
      {
        intro: body('Pengantar formulir'),
        consentLabel: f.object(
          {
            before: f.required('Teks sebelum tautan', 200, { keepSpaces: true }),
            linkLabel: f.required('Label tautan kebijakan privasi', 40),
            after: f.text('Teks setelah tautan', 80, { keepSpaces: true }),
          },
          { label: 'Label persetujuan' },
        ),
      },
      { label: 'Formulir' },
    ),
    seo: seoSchema,
  }),
  thankYou: f.object({
    headline: headline(),
    body: body(),
    whatsappCtaLabel: cta('Label CTA WhatsApp'),
    nextLinks: links('Tautan berikutnya', 4),
    seo: seoSchema,
  }),
  notFound: f.object({
    headline: headline(),
    body: body(),
    links: links('Tautan', 4),
    seo: seoSchema,
  }),
  privacy: f.object({
    body: f.richText('Isi kebijakan'),
    effectiveDate: f.required('Tanggal berlaku', 10, { format: 'date', publicCopy: false }),
    seo: seoSchema,
  }),
  blogIndex: f.object({ ...emptyStatePage, seo: seoSchema }),
  workIndex: f.object({ ...emptyStatePage, seo: seoSchema }),
} as const satisfies Record<PageKey, ObjectField>

/** Admin URL ids (sidebar) to page keys, and the Indonesian names of the pages. */
export const PAGE_ROUTES = [
  { id: 'home', key: 'home', label: 'Beranda', path: '/' },
  { id: 'product', key: 'product', label: 'Produk', path: '/products/ai-agents' },
  { id: 'services', key: 'servicesOverview', label: 'Layanan', path: '/services' },
  { id: 'about', key: 'about', label: 'Tentang', path: '/about' },
  { id: 'contact', key: 'contact', label: 'Kontak', path: '/contact' },
  { id: 'thank-you', key: 'thankYou', label: 'Terima kasih', path: '/contact/thank-you' },
  { id: '404', key: 'notFound', label: '404', path: null },
  { id: 'privacy', key: 'privacy', label: 'Privasi', path: '/privacy-policy' },
  { id: 'blog', key: 'blogIndex', label: 'Indeks blog', path: '/blog' },
  { id: 'work', key: 'workIndex', label: 'Indeks karya', path: '/work' },
] as const satisfies readonly { id: string; key: PageKey; label: string; path: string | null }[]

export type PageRoute = (typeof PAGE_ROUTES)[number]

/** Sections the page editor shows, in page order, with the SEO panel last (CPR-85). */
export function editorSections(key: PageKey): string[] {
  return Object.keys(pageSchemas[key].fields)
}
