/**
 * Site settings descriptors (CMS plan section 2.1, CPR-29). Pure module shared by the admin form,
 * the server action, the seed and the tests.
 *
 * Editors may change Contact, Social and the WhatsApp templates. Brand, Lead routing, Feature
 * toggles, Analytics, Verification and SEO are Admin only (`adminOnly`), enforced by
 * `parseFields` on the server: a non-Admin submission keeps the stored values of those groups.
 */
import { f, type MediaValue } from '../cms/fields'

export const settingsGlobalSchema = f.object({
  brand: f.object(
    {
      siteName: f.required('Nama situs', 60),
      productName: f.required('Nama produk', 60, {
        hint: 'Nama kerja produk AI Agents (Q9). Mengganti di sini mengubah semua tempat.',
      }),
      defaultOgImage: f.media('Gambar OG bawaan', 'Ukuran 1200 × 630 px.'),
      logo: f.media('Logo organisasi', 'Untuk data terstruktur (JSON-LD).'),
    },
    { label: 'Brand', adminOnly: true },
  ),
  contact: f.object(
    {
      email: f.optional('Email publik', 254, { format: 'email', publicCopy: false }),
      whatsappNumber: f.required('Nomor WhatsApp', 16, {
        format: 'e164',
        publicCopy: false,
        hint: 'Format internasional dengan +, misalnya +6285199368510.',
      }),
      address: f.optional('Alamat', 300, { multiline: true }),
      legalEntityName: f.optional('Nama badan hukum', 160),
      legalEntityRegistration: f.optional('Nomor registrasi badan hukum', 80, {
        publicCopy: false,
      }),
    },
    { label: 'Kontak' },
  ),
  social: f.object(
    {
      instagram: f.optional('Instagram', 300, { format: 'url', publicCopy: false }),
      linkedin: f.optional('LinkedIn', 300, { format: 'url', publicCopy: false }),
      tiktok: f.optional('TikTok', 300, { format: 'url', publicCopy: false }),
      youtube: f.optional('YouTube', 300, { format: 'url', publicCopy: false }),
      x: f.optional('X', 300, { format: 'url', publicCopy: false }),
    },
    { label: 'Media sosial', hint: 'Hanya akun yang diisi yang tampil di situs.' },
  ),
  leadRouting: f.object(
    {
      inboxEmails: f.list(
        'Email penerima lead',
        f.required('Email', 254, { format: 'email', publicCopy: false }),
        5,
        { itemLabel: 'Email' },
      ),
      waitlistNotifications: f.boolean('Kirim notifikasi waitlist'),
    },
    { label: 'Penerusan lead', adminOnly: true },
  ),
  features: f.object(
    {
      showTeam: f.boolean('Tampilkan bagian tim di Tentang'),
      showSelectedWork: f.boolean('Tampilkan "Selected work" di Beranda'),
      enableLogoIntro: f.boolean('Aktifkan intro logo'),
      enableRealtimeSino: f.boolean('Aktifkan Sino 3D realtime'),
      enableStickyCtaBar: f.boolean('Aktifkan bar CTA lengket'),
    },
    {
      label: 'Fitur situs',
      adminOnly: true,
      hint: 'Matikan fitur berat tanpa deploy bila performa turun.',
    },
  ),
  analytics: f.object(
    {
      enabled: f.boolean('Aktifkan Umami'),
      umamiWebsiteId: f.optional('Umami website ID', 64, { format: 'token', publicCopy: false }),
    },
    { label: 'Analitik', adminOnly: true },
  ),
  verification: f.object(
    {
      googleSearchConsoleToken: f.optional('Token Google Search Console', 128, {
        format: 'token',
        publicCopy: false,
      }),
    },
    { label: 'Verifikasi', adminOnly: true },
  ),
  seo: f.object(
    { indexable: f.boolean('Izinkan mesin pencari mengindeks situs') },
    { label: 'SEO situs', adminOnly: true },
  ),
})

export const settingsLocaleSchema = f.object({
  contact: f.object(
    {
      businessHours: f.optional('Jam operasional', 120, {
        hint: 'Kosongkan bila belum ada jam yang disetujui.',
      }),
    },
    { label: 'Kontak' },
  ),
  whatsapp: f.object(
    {
      general: f.required('Pesan umum', 300, { multiline: true, hint: 'Placeholder: {site}' }),
      product: f.required('Pesan produk', 300, {
        multiline: true,
        hint: 'Placeholder: {site}, {product}',
      }),
      thankYou: f.required('Pesan halaman terima kasih', 300, {
        multiline: true,
        hint: 'Placeholder: {site}',
      }),
      services: f.list(
        'Pesan per layanan',
        f.object({
          serviceSlug: f.required('Layanan', 80, { format: 'slug', publicCopy: false }),
          message: f.required('Pesan', 300, {
            multiline: true,
            hint: 'Placeholder: {site}, {service}',
          }),
        }),
        20,
        { itemLabel: 'Layanan', fixed: true, titleKey: 'serviceSlug' },
      ),
    },
    { label: 'Template WhatsApp' },
  ),
  seo: f.object(
    {
      titleTemplate: f.required('Template judul', 60, { hint: 'Wajib memuat {title}.' }),
      defaultDescription: f.required('Deskripsi bawaan', 160, { multiline: true }),
    },
    { label: 'SEO bawaan', adminOnly: true },
  ),
})

export type SettingsGlobal = {
  brand: {
    siteName: string
    productName: string
    defaultOgImage: MediaValue
    logo: MediaValue
  }
  contact: {
    email: string | null
    whatsappNumber: string
    address: string | null
    legalEntityName: string | null
    legalEntityRegistration: string | null
  }
  social: Record<'instagram' | 'linkedin' | 'tiktok' | 'youtube' | 'x', string | null>
  leadRouting: { inboxEmails: string[]; waitlistNotifications: boolean }
  features: {
    showTeam: boolean
    showSelectedWork: boolean
    enableLogoIntro: boolean
    enableRealtimeSino: boolean
    enableStickyCtaBar: boolean
  }
  analytics: { enabled: boolean; umamiWebsiteId: string | null }
  verification: { googleSearchConsoleToken: string | null }
  seo: { indexable: boolean }
}

export type SettingsLocale = {
  contact: { businessHours: string | null }
  whatsapp: {
    general: string
    product: string
    thankYou: string
    services: { serviceSlug: string; message: string }[]
  }
  seo: { titleTemplate: string; defaultDescription: string }
}

/** Groups the general settings page edits. SEO has its own page (CPR-85). */
export const SITE_FORM_GLOBAL_GROUPS = [
  'brand',
  'contact',
  'social',
  'leadRouting',
  'features',
  'analytics',
  'verification',
] as const
export const SITE_FORM_LOCALE_GROUPS = ['contact', 'whatsapp'] as const
