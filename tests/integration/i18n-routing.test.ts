import { describe, expect, it } from 'vitest'

const base = new URL(process.env.TEST_BASE_URL ?? 'http://127.0.0.1:3001')
if (!['127.0.0.1', 'localhost'].includes(base.hostname) || base.protocol !== 'http:') {
  throw new Error('I18n HTTP tests require a loopback server')
}
const get = (path: string, headers: Record<string, string> = {}) =>
  fetch(new URL(path, base), { redirect: 'manual', headers })
const localeCookie = (response: Response) =>
  response.headers.getSetCookie().some((value) => value.startsWith('NEXT_LOCALE='))

const shells = [
  ['/', 'Home'],
  ['/products/ai-agents', 'AI Agents'],
  ['/services', 'Services'],
  ['/work', 'Work'],
  ['/blog', 'Blog'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
  ['/contact/thank-you', 'Thank you'],
  ['/privacy-policy', 'Privacy Policy'],
] as const
describe('English shells without a locale prefix', () => {
  it.each(shells)('serves %s', async (path, title) => {
    const response = await get(path)
    const html = await response.text()
    expect(response.status).toBe(200)
    expect(html).toContain('lang="en"')
    expect((html.match(/<html\b/g) ?? []).length).toBe(1)
    expect((html.match(/<body\b/g) ?? []).length).toBe(1)
    expect(html).toMatch(new RegExp(`<h1[^>]*>${title}</h1>`))
    expect(html).toContain('<title>Sineva</title>')
    expect(html).toContain('This page is being prepared.')
    expect(html).not.toMatch(/Halaman sedang disiapkan|Sineva Tech/)
    expect(html).toMatch(/name="robots"[^>]*content="noindex/)
    expect(html).not.toMatch(/hreflang=|next-intl\.messages|MISSING_MESSAGE/)
  })
})

describe('root has no locale negotiation', () => {
  it.each<Record<string, string>>([
    {},
    { cookie: 'NEXT_LOCALE=id', 'accept-language': 'id' },
    { cookie: 'NEXT_LOCALE=en', 'accept-language': 'id;q=0.9,en;q=0.1' },
    { 'accept-language': 'fr-FR' },
    { 'accept-language': 'id' },
    { 'accept-language': 'not_a_locale;q=broken' },
    { cookie: 'NEXT_LOCALE=unknown', 'accept-language': 'en;q=1.5' },
  ])('serves English 200 at / for headers %#', async (headers) => {
    const response = await get('/?utm_source=test', headers)
    const html = await response.text()
    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
    expect(html).toContain('lang="en"')
    expect(html).toMatch(/<h1[^>]*>Home<\/h1>/)
    expect(localeCookie(response)).toBe(false)
  })
  it('sets no locale cookie on any English page', async () => {
    expect(localeCookie(await get('/about', { cookie: 'NEXT_LOCALE=id' }))).toBe(false)
  })
})

describe('explicitly prefixed default locale', () => {
  it.each([
    ['/en', '/'],
    ['/en/services', '/services'],
    ['/en/products/ai-agents', '/products/ai-agents'],
    ['/en/services?utm_source=x', '/services?utm_source=x'],
  ])('redirects %s to %s', async (path, want) => {
    const response = await get(path)
    expect(response.status).toBe(307)
    const target = new URL(response.headers.get('location')!, base)
    expect(target.origin).toBe(base.origin)
    expect(target.pathname + target.search).toBe(want)
    expect((await get(want)).status).toBe(200)
  })
  it('keeps a trailing slash from becoming a second URL', async () => {
    const response = await get('/services/')
    expect([307, 308]).toContain(response.status)
    expect(new URL(response.headers.get('location')!, base).pathname).toBe('/services')
  })
})

describe('retired and unknown URLs', () => {
  it.each([
    '/id',
    '/id/layanan',
    '/id/tentang-kami',
    '/id/blog',
    '/layanan',
    '/kontak',
    '/portfolio',
    '/portofolio',
    '/products/chatbot',
    '/produk/chatbot',
    '/services/web-development/extra',
    '/fr/about',
    '/unknown',
    '/services/unknown',
    '/work/unknown',
    '/blog/unknown',
    '/blog/a.b',
    '/products/ai-agents/unknown',
  ])('returns 404 with the English 404 page at %s', async (path) => {
    const response = await get(path)
    const html = await response.text()
    expect(response.status).toBe(404)
    expect(html).toMatch(/name="robots"[^>]*content="noindex/)
    expect(html).toContain('Page not found.')
    expect(html).not.toMatch(/Halaman tidak ditemukan|ai-guide|panduan-ai/)
  })
  it('renders the 404 inside the English root layout', async () => {
    const html = await (await get('/unknown')).text()
    // Next 16.4 answers notFound() with a synthetic `<html id="__next_error__">` transport
    // shell that has no lang attribute; the real layout travels in the RSC payload and is
    // applied on hydration. Assert the payload, since that is what the browser ends up with.
    expect(html).toContain(String.raw`\"html\",null,{\"lang\":\"en\"`)
  })
})

it('leaves admin, API and assets outside localized routing', async () => {
  const headers = { cookie: 'NEXT_LOCALE=en', 'accept-language': 'en', 'x-next-intl-locale': 'en' }
  const login = await get('/admin/login', headers)
  const loginHtml = await login.text()
  expect(login.status).toBe(200)
  expect(loginHtml).toContain('lang="id"')
  expect(loginHtml).toContain('name="password"')
  expect(loginHtml).not.toContain('This page is being prepared.')
  expect(localeCookie(login)).toBe(false)
  const admin = await get('/admin', headers)
  expect(admin.status).toBe(307)
  expect(new URL(admin.headers.get('location')!, base).pathname).toBe('/admin/login')
  const api = await get('/api/users', headers)
  expect(api.status).toBe(404)
  const asset = await get('/brand/sineva-symbol-original.svg', headers)
  expect(asset.status).toBe(200)
  expect(asset.headers.get('content-type')).toContain('image/svg+xml')
  expect(localeCookie(asset)).toBe(false)
  // public/ files are not rewritten into the localized tree.
  const lottie = await get('/lottie/sineva-symbol-intro.json', headers)
  expect(lottie.status).toBe(200)
  expect(lottie.headers.get('content-type')).toContain('application/json')
})
