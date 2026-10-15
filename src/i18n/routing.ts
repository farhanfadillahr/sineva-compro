import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['id', 'en'],
  defaultLocale: 'id',
  localePrefix: 'always',
  localeDetection: true,
  alternateLinks: false,
  localeCookie: {
    name: 'NEXT_LOCALE',
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 31_536_000,
  },
  pathnames: {
    '/': '/',
    '/services': { id: '/layanan', en: '/services' },
    '/services/web-development': {
      id: '/layanan/web-development',
      en: '/services/web-development',
    },
    '/services/ai-automation': { id: '/layanan/ai-otomasi', en: '/services/ai-automation' },
    '/services/[slug]': { id: '/layanan/[slug]', en: '/services/[slug]' },
    '/portfolio': { id: '/portofolio', en: '/portfolio' },
    '/portfolio/[slug]': { id: '/portofolio/[slug]', en: '/portfolio/[slug]' },
    '/products/chatbot': { id: '/produk/chatbot', en: '/products/chatbot' },
    '/blog': '/blog',
    '/blog/[slug]': '/blog/[slug]',
    '/about': { id: '/tentang-kami', en: '/about' },
    '/contact': { id: '/kontak', en: '/contact' },
    '/contact/thank-you': { id: '/kontak/terima-kasih', en: '/contact/thank-you' },
    '/privacy-policy': { id: '/kebijakan-privasi', en: '/privacy-policy' },
  },
})

export type Locale = (typeof routing.locales)[number]
