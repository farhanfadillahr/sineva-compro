import type { SiteSettingsDTO } from '../../features/content/types'
import { asset } from './helpers'

// Only facts the Founder or product owner has confirmed are set. Everything else is `null`, which
// the UI treats as "hide this", never as placeholder text:
// - WhatsApp: confirmed as 085199368510 (national form). E.164 drops the leading 0 and adds the
//   Indonesian country code 62, which is what wa.me needs.
// - Instagram: confirmed handle `sineva.tech`.
// - Public email, address, legal entity, business hours and the other social accounts are not
//   confirmed.
export const siteSettings: SiteSettingsDTO = {
  locale: 'en',
  brand: {
    siteName: 'Sineva',
    productName: 'Sineva AI Agents',
    defaultOgImage: asset(
      '/og/default-v008.png',
      1200,
      630,
      'Sineva and Sino, a friendly AI companion for everyday work',
    ),
    logo: null,
  },
  contact: {
    email: null,
    businessHours: null,
    address: null,
    legalEntity: null,
  },
  whatsapp: {
    number: '+6285199368510',
    templates: {
      general: "Hi Sineva, I'd like to talk about using AI in my business.",
      product: "Hi Sineva, I'd like to know more about Sineva AI Agents.",
      thankYou: 'Hi Sineva, I just sent the contact form and would like a faster reply.',
      // One resolved message per service, not a `{service name}` template: it works for any
      // caller, including ones that cannot supply the service title.
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
    instagram: 'https://www.instagram.com/sineva.tech/',
    linkedin: null,
    tiktok: null,
    youtube: null,
    x: null,
  },
  features: {
    // No real team members or projects exist to show yet: an empty section would be dishonest.
    showTeam: false,
    showSelectedWork: false,
    enableLogoIntro: true,
    enableRealtimeSino: true,
    enableStickyCtaBar: true,
  },
  analytics: { enabled: false, umamiWebsiteId: null },
  seo: {
    titleTemplate: '{title} | Sineva',
    defaultDescription:
      'Make your business run smarter with AI. Meet Sino, see what AI can do for you, and book a free consultation.',
    indexable: true,
  },
  verification: { googleSearchConsoleToken: null },
}
