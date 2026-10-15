import { expect, it } from 'vitest'

const base = new URL(process.env.TEST_BASE_URL ?? 'http://127.0.0.1:3001')
if (!['127.0.0.1', 'localhost'].includes(base.hostname) || base.protocol !== 'http:') {
  throw new Error('I18n HTTP tests require a loopback server')
}
const shells = [
  ['/id', 'Beranda', 'id'],
  ['/en', 'Home', 'en'],
  ['/id/layanan', 'Layanan', 'id'],
  ['/en/services', 'Services', 'en'],
  ['/id/layanan/web-development', 'Web Development', 'id'],
  ['/en/services/web-development', 'Web Development', 'en'],
  ['/id/layanan/ai-otomasi', 'AI & Otomasi', 'id'],
  ['/en/services/ai-automation', 'AI & Automation', 'en'],
  ['/id/portofolio', 'Portofolio', 'id'],
  ['/en/portfolio', 'Portfolio', 'en'],
  ['/id/produk/chatbot', 'Produk Chatbot', 'id'],
  ['/en/products/chatbot', 'Chatbot Product', 'en'],
  ['/id/blog', 'Blog', 'id'],
  ['/en/blog', 'Blog', 'en'],
  ['/id/tentang-kami', 'Tentang kami', 'id'],
  ['/en/about', 'About us', 'en'],
  ['/id/kontak', 'Kontak', 'id'],
  ['/en/contact', 'Contact', 'en'],
  ['/id/kontak/terima-kasih', 'Terima kasih', 'id'],
  ['/en/contact/thank-you', 'Thank you', 'en'],
  ['/id/kebijakan-privasi', 'Kebijakan Privasi', 'id'],
  ['/en/privacy-policy', 'Privacy Policy', 'en'],
] as const
it.each(shells)('serves localized shell %s', async (path, title, locale) => {
  const response = await fetch(new URL(path, base), { redirect: 'manual' })
  const html = await response.text()
  expect(response.status).toBe(200)
  expect(html).toContain(`lang="${locale}"`)
  expect((html.match(/<html\b/g) ?? []).length).toBe(1)
  expect((html.match(/<body\b/g) ?? []).length).toBe(1)
  expect(html).toContain(title.replaceAll('&', '&amp;'))
  expect(html).toContain(
    locale === 'en' ? 'This page is being prepared.' : 'Halaman sedang disiapkan.',
  )
  expect(html).not.toContain(
    locale === 'en' ? 'Halaman sedang disiapkan.' : 'This page is being prepared.',
  )
  expect(html).toMatch(/name="robots"[^>]*content="noindex/)
  expect(html).not.toMatch(/hreflang=|next-intl\.messages|MISSING_MESSAGE/)
})
it.each([
  [{ cookie: 'NEXT_LOCALE=id', 'accept-language': 'en-US' }, '/id'],
  [{ cookie: 'NEXT_LOCALE=en', 'accept-language': 'id' }, '/en'],
  [{ cookie: 'NEXT_LOCALE=unknown', 'accept-language': 'en-GB' }, '/en'],
  [{ 'accept-language': 'id;q=0.9,en;q=0.1' }, '/id'],
  [{ 'accept-language': 'en;q=0' }, '/id'],
  [{ 'accept-language': 'fr-FR' }, '/id'],
  [{ 'accept-language': 'not_a_locale;q=broken' }, '/id'],
  [{}, '/id'],
] as const)('negotiates root without caching personalized redirect %#', async (headers, want) => {
  const response = await fetch(new URL('/?utm_source=test', base), {
    redirect: 'manual',
    headers: headers as Record<string, string>,
  })
  expect(response.status).toBe(307)
  const target = new URL(response.headers.get('location')!, base)
  expect(target.origin).toBe(base.origin)
  expect(target.pathname).toBe(want)
  expect(target.search).toBe('?utm_source=test')
  expect(response.headers.get('cache-control')).toContain('private')
  expect(response.headers.get('cache-control')).toContain('no-store')
  expect(response.headers.get('vary')?.toLowerCase()).toContain('cookie')
  expect(response.headers.get('vary')?.toLowerCase()).toContain('accept-language')
  expect((await fetch(target, { redirect: 'manual' })).status).toBe(200)
})
it('honors an explicit EN URL over cookie, browser and forged locale header', async () => {
  const response = await fetch(new URL('/en/about', base), {
    redirect: 'manual',
    headers: { cookie: 'NEXT_LOCALE=id', 'accept-language': 'id', 'x-next-intl-locale': 'id' },
  })
  const html = await response.text()
  expect(response.status).toBe(200)
  expect(html).toContain('lang="en"')
  expect(html).toContain('About us')
  expect(html).not.toMatch(
    /Tentang kami|Halaman sedang disiapkan|Web development, AI, dan otomasi bisnis/,
  )
  const cookie = response.headers.getSetCookie().find((value) => value.startsWith('NEXT_LOCALE='))
  expect(cookie).toMatch(/^NEXT_LOCALE=en;/)
  expect(cookie).toMatch(/Path=\//i)
  expect(cookie).toMatch(/SameSite=lax/i)
  expect(cookie).toMatch(/Secure/i)
  expect(response.headers.get('link') ?? '').not.toContain('hreflang')
})
it('keeps query strings when canonicalizing an internal static pathname', async () => {
  const response = await fetch(new URL('/id/about?utm_source=alias', base), { redirect: 'manual' })
  expect([307, 308]).toContain(response.status)
  const target = new URL(response.headers.get('location')!, base)
  expect(target.pathname).toBe('/id/tentang-kami')
  expect(target.search).toBe('?utm_source=alias')
  expect((await fetch(target, { redirect: 'manual' })).status).toBe(200)
})
it.each([
  '/fr/about',
  '/unknown',
  '/id/blog/unknown',
  '/en/blog/unknown',
  '/id/portofolio/unknown',
  '/en/portfolio/unknown',
  '/en/services/unknown',
  '/en/blog/a.b',
])('returns 404 without inventing published content at %s', async (path) => {
  const response = await fetch(new URL(path, base), { redirect: 'manual' })
  const html = await response.text()
  expect(response.status).toBe(404)
  // Next sends an error transport shell before hydration on notFound().
  // The locale HTML attribute is verified on the rendered browser DOM.
  expect(html).toMatch(/name="robots"[^>]*content="noindex/)
  if (path.startsWith('/en/')) {
    expect(html).toContain('Page not found.')
  }
  if (path.startsWith('/id/')) {
    expect(html).toContain('Halaman tidak ditemukan.')
  }
  expect(html).not.toMatch(/ai-guide|panduan-ai/)
})
it('leaves admin, API and assets outside localized routing', async () => {
  const headers = { cookie: 'NEXT_LOCALE=en', 'accept-language': 'en', 'x-next-intl-locale': 'en' }
  const login = await fetch(new URL('/admin/login', base), { headers, redirect: 'manual' })
  const loginHtml = await login.text()
  expect(login.status).toBe(200)
  expect(loginHtml).toContain('lang="id"')
  expect(loginHtml).toContain('name="password"')
  expect(loginHtml).not.toContain('This page is being prepared.')
  expect(login.headers.getSetCookie().some((value) => value.startsWith('NEXT_LOCALE='))).toBe(false)
  const admin = await fetch(new URL('/admin', base), { headers, redirect: 'manual' })
  expect(admin.status).toBe(307)
  expect(new URL(admin.headers.get('location')!, base).pathname).toBe('/admin/login')
  const api = await fetch(new URL('/api/users', base), { headers, redirect: 'manual' })
  expect(api.status).toBe(404)
  const asset = await fetch(new URL('/brand/sineva-symbol-original.svg', base), {
    headers,
    redirect: 'manual',
  })
  expect(asset.status).toBe(200)
  expect(asset.headers.get('content-type')).toContain('image/svg+xml')
  expect(asset.headers.getSetCookie().some((value) => value.startsWith('NEXT_LOCALE='))).toBe(false)
})
