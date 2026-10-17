import type { SiteSettingsDTO } from '../../../features/content/types'
import { siteSettings as siteSettingsEn } from '../site-settings'

// Indonesian settings. Facts (number, social links, feature switches) come from the English
// settings, so only the per-locale words are written here: WhatsApp messages and the default SEO
// description. The brand group (names, default OG image and its alt) is one global value in the
// CMS, so it stays the English one here too and both content sources render the same page.
export const siteSettings: SiteSettingsDTO = {
  ...siteSettingsEn,
  locale: 'id',
  whatsapp: {
    ...siteSettingsEn.whatsapp,
    templates: {
      general: 'Halo Sineva, saya ingin ngobrol soal pemakaian AI di bisnis saya.',
      product: 'Halo Sineva, saya ingin tahu lebih banyak soal Sineva Product Suite.',
      thankYou: 'Halo Sineva, saya baru mengirim formulir kontak dan ingin balasan lebih cepat.',
      services: [
        {
          serviceSlug: 'ai-discovery',
          message: 'Halo Sineva, saya tertarik dengan AI Discovery. Bisa kita ngobrol?',
        },
        {
          serviceSlug: 'ai-build',
          message: 'Halo Sineva, saya tertarik dengan AI Build. Bisa kita ngobrol?',
        },
        {
          serviceSlug: 'ai-enablement',
          message: 'Halo Sineva, saya tertarik dengan AI Enablement. Bisa kita ngobrol?',
        },
      ],
    },
  },
  seo: {
    ...siteSettingsEn.seo,
    defaultDescription:
      'Temukan cara praktis memakai AI untuk tugas yang menyita waktu. Kenalan dengan Sino dan jadwalkan konsultasi gratis.',
  },
}
