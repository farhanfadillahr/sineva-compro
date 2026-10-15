import { expect, it } from 'vitest'
import { getPathname } from '../../src/i18n/navigation'
import type { Locale } from '../../src/i18n/routing'

const pages = [
  ['/', '/id', '/en'],
  ['/services', '/id/layanan', '/en/services'],
  ['/services/web-development', '/id/layanan/web-development', '/en/services/web-development'],
  ['/services/ai-automation', '/id/layanan/ai-otomasi', '/en/services/ai-automation'],
  ['/portfolio', '/id/portofolio', '/en/portfolio'],
  ['/products/chatbot', '/id/produk/chatbot', '/en/products/chatbot'],
  ['/blog', '/id/blog', '/en/blog'],
  ['/about', '/id/tentang-kami', '/en/about'],
  ['/contact', '/id/kontak', '/en/contact'],
  ['/contact/thank-you', '/id/kontak/terima-kasih', '/en/contact/thank-you'],
  ['/privacy-policy', '/id/kebijakan-privasi', '/en/privacy-policy'],
] as const
it.each(pages)('maps %s to the PRD URL in each locale', (href, id, en) => {
  expect(getPathname({ locale: 'id', href })).toBe(id)
  expect(getPathname({ locale: 'en', href })).toBe(en)
})
it.each([
  ['id', '/services/[slug]', 'layanan-baru', '/id/layanan/layanan-baru'],
  ['en', '/services/[slug]', 'new-service', '/en/services/new-service'],
  ['id', '/portfolio/[slug]', 'kasus-ai', '/id/portofolio/kasus-ai'],
  ['en', '/portfolio/[slug]', 'ai-case', '/en/portfolio/ai-case'],
  ['id', '/blog/[slug]', 'panduan-ai', '/id/blog/panduan-ai'],
  ['en', '/blog/[slug]', 'ai-guide', '/en/blog/ai-guide'],
] as const)('builds dynamic %s %s without translating its slug', (locale, pathname, slug, want) => {
  expect(getPathname({ locale: locale as Locale, href: { pathname, params: { slug } } })).toBe(want)
})
