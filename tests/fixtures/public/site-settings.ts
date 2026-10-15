import type { SiteSettingsDTO } from '../../../src/features/content/types'
import { media } from './helpers'

// Mirrors the future `demo` seed (admin CMS plan section 4.1). Optional fields are left empty on
// purpose (address, legal entity, TikTok, YouTube, X) so landing tests cover the hidden state.
export const siteSettings: SiteSettingsDTO = {
  locale: 'en',
  brand: {
    siteName: 'Sineva',
    defaultOgImage: media('og-default', 1200, 630, 'Sino waving next to the Sineva name', true),
    logo: media('logo', 512, 512, 'Sineva logo'),
  },
  contact: {
    email: 'hello@example.com',
    businessHours: 'Monday to Friday, 9:00 to 17:00 (WIB)',
    address: null,
    legalEntity: null,
  },
  whatsapp: {
    number: '+6280000000000',
    templates: {
      general: "Hi Sineva, I'd like to talk about using AI in my business.",
      product: "Hi Sineva, I'd like to know more about Sineva AI Agents.",
      thankYou: 'Hi Sineva, I just sent the contact form and would like a faster reply.',
      services: [
        {
          serviceSlug: 'ai-discovery',
          message: "Hi Sineva, I'm interested in AI Discovery. Can we talk?",
        },
        {
          serviceSlug: 'ai-build',
          message: "Hi Sineva, I'm interested in AI Build. Can we talk?",
        },
        {
          serviceSlug: 'ai-enablement',
          message: "Hi Sineva, I'm interested in AI Enablement. Can we talk?",
        },
      ],
    },
  },
  social: {
    instagram: 'https://example.com/social/sineva-demo/instagram',
    linkedin: 'https://example.com/social/sineva-demo/linkedin',
    tiktok: null,
    youtube: null,
    x: null,
  },
  features: {
    showTeam: true,
    showSelectedWork: true,
    enableLogoIntro: true,
    enableRealtimeSino: true,
    enableStickyCtaBar: true,
  },
  analytics: { enabled: false, umamiWebsiteId: null },
  seo: {
    titleTemplate: '{title} | Sineva',
    defaultDescription:
      'Sineva helps businesses use AI with ready-to-use AI agents and AI consulting. Talk to us about your first step.',
    indexable: true,
  },
  verification: { googleSearchConsoleToken: null },
}
