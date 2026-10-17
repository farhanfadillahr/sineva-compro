import type { Metadata } from 'next'
import { describe, expect, it, vi } from 'vitest'
import en from '../../messages/en.json'
import { staticContent } from '../../src/content/static'

// Pages pass these server actions to their forms (CPR-105); metadata never calls them.
vi.mock('@/features/leads/actions', () => ({ saveContact: vi.fn(), submitContact: vi.fn() }))
vi.mock('@/features/waitlist/actions', () => ({ joinWaitlist: vi.fn() }))
vi.mock('next-intl/server', () => ({
  getMessages: async () => en,
  getLocale: async () => 'en',
  getTranslations: async () => (key: string) => key,
  setRequestLocale: () => {},
}))

const params = (extra: Record<string, string> = {}) => ({
  params: Promise.resolve({ locale: 'en', ...extra }),
})

type MetadataRoute = { generateMetadata: (props: never) => Promise<Metadata> }
const load = async (path: string) => (await import(path)) as MetadataRoute

// Every public page of phase 1 except the blog, which has its own metadata lane. `canonical` is
// the unprefixed path (single locale, as-needed prefix); metadataBase makes it absolute.
const pages = [
  { name: 'home', path: '/', module: 'home' },
  { name: 'services list', path: '/services', module: 'services-list' },
  ...staticContent.services.map(({ slug }) => ({
    name: `service ${slug}`,
    path: `/services/${slug}`,
    module: 'service-detail',
    slug,
  })),
  { name: 'ai agents', path: '/products/ai-agents', module: 'product' },
  { name: 'about', path: '/about', module: 'about' },
  { name: 'contact', path: '/contact', module: 'contact' },
  { name: 'privacy', path: '/privacy-policy', module: 'privacy' },
] as const

const modules: Record<string, string> = {
  home: '../../src/app/(public)/[locale]/page',
  'services-list': '../../src/app/(public)/[locale]/services/page',
  'service-detail': '../../src/app/(public)/[locale]/services/[slug]/page',
  product: '../../src/app/(public)/[locale]/products/ai-agents/page',
  about: '../../src/app/(public)/[locale]/about/page',
  contact: '../../src/app/(public)/[locale]/contact/page',
  privacy: '../../src/app/(public)/[locale]/privacy-policy/page',
  'thank-you': '../../src/app/(public)/[locale]/contact/thank-you/page',
  work: '../../src/app/(public)/[locale]/work/page',
  'not-found': '../../src/app/(public)/[locale]/not-found',
}

async function metadataOf(key: string, slug?: string): Promise<Metadata> {
  const route = await load(modules[key]!)
  return route.generateMetadata(params(slug ? { slug } : {}) as never)
}

const ogOf = (meta: Metadata) => meta.openGraph as Record<string, unknown> | null | undefined

describe('indexable public pages', () => {
  it.each(pages)('$name has a title, description, canonical and Open Graph tags', async (page) => {
    const meta = await metadataOf(page.module, 'slug' in page ? page.slug : undefined)
    expect(meta.title).toBeTruthy()
    expect(meta.description).toBeTruthy()
    expect(meta.alternates?.canonical).toBe(page.path)
    expect(ogOf(meta)).toMatchObject({
      url: page.path,
      title: expect.any(String),
      description: meta.description,
    })
    // Robots come from the layout; a page only adds its own noindex.
    expect(meta.robots).toBeUndefined()
  })

  it('gives each page its own title and description', async () => {
    const all = await Promise.all(
      pages.map((page) => metadataOf(page.module, 'slug' in page ? page.slug : undefined)),
    )
    const titles = all.map((meta) => JSON.stringify(meta.title))
    const descriptions = all.map((meta) => meta.description)
    expect(new Set(titles).size).toBe(titles.length)
    expect(new Set(descriptions).size).toBe(descriptions.length)
  })
})

describe('pages that must not be indexed', () => {
  it.each(['thank-you', 'work', 'not-found'])('%s is noindex and nofollow', async (key) => {
    const meta = await metadataOf(key)
    expect(meta.robots).toEqual({ index: false, follow: false })
    expect(meta.title).toBeTruthy()
    expect(meta.description).toBeTruthy()
  })

  it('work has a canonical, the thank-you page too', async () => {
    expect((await metadataOf('work')).alternates?.canonical).toBe('/work')
    expect((await metadataOf('thank-you')).alternates?.canonical).toBe('/contact/thank-you')
  })

  it('the 404 page carries Open Graph title and description but no canonical', async () => {
    // A canonical on a 404 would name one URL for every missing path.
    const meta = await metadataOf('not-found')
    expect(meta.alternates?.canonical).toBeUndefined()
    expect(ogOf(meta)).toMatchObject({ title: expect.any(String), description: meta.description })
  })
})
