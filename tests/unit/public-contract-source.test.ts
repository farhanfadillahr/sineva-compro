import { describe, expect, it } from 'vitest'
import { createFixtureContentSource } from '../../src/features/content/fixture-source'
import type { PublicContentSource } from '../../src/features/content/public'
import { PAGE_KEYS, type ContentLocale } from '../../src/features/content/types'
import { walkKeys, walkObjectsWithKey } from '../fixtures/public/walk'

const source: PublicContentSource = createFixtureContentSource()
const en: ContentLocale = 'en'
// 'id' is enabled in routing but has no fixture content, which is exactly the "empty" case.
const id: ContentLocale = 'id'

const MEDIA_KEYS = ['alt', 'blurDataUrl', 'height', 'url', 'width']
const SEO_KEYS = ['canonicalUrl', 'metaDescription', 'metaTitle', 'noindex', 'ogImage']
const SERVICE_SUMMARY_KEYS = ['icon', 'locale', 'pose', 'slug', 'summary', 'title']
const WORK_SUMMARY_KEYS = [
  'cover',
  'featured',
  'locale',
  'projectType',
  'serviceSlug',
  'slug',
  'stack',
  'summary',
  'title',
]
const POST_SUMMARY_KEYS = [
  'author',
  'category',
  'cover',
  'excerpt',
  'locale',
  'publishedAt',
  'readingMinutes',
  'slug',
  'title',
]

// Keys that must never leave the server: internal ids, storage keys, draft/lead/author data.
const FORBIDDEN_KEYS = [
  'id',
  'uuid',
  'entityId',
  'storageKey',
  'objectKey',
  'bucket',
  'status',
  'draft',
  'isDemo',
  'createdAt',
  'createdBy',
  'updatedBy',
  'authorEmail',
  'leadInboxEmails',
  'leadRouting',
  'password',
  'secret',
]

const sorted = (value: object) => Object.keys(value).sort()
const withSeo = (keys: string[]) => [...keys, 'seo'].sort()

function expectSafeProjection(value: unknown, { allowEmail = false } = {}) {
  const keys = new Set(walkKeys(value))
  for (const forbidden of FORBIDDEN_KEYS) expect(keys.has(forbidden), forbidden).toBe(false)
  if (!allowEmail) expect(keys.has('email')).toBe(false)
  for (const media of walkObjectsWithKey(value, 'blurDataUrl')) {
    expect(sorted(media)).toEqual(MEDIA_KEYS)
  }
  for (const seo of walkObjectsWithKey(value, 'metaTitle')) {
    expect(sorted(seo)).toEqual(SEO_KEYS)
  }
}

describe('fixture content source: interface', () => {
  it('implements every public read function', () => {
    for (const name of [
      'getSiteSettings',
      'getPage',
      'listServices',
      'getService',
      'listCapabilities',
      'listIndustries',
      'listFaq',
      'listWork',
      'getWork',
      'listPosts',
      'getPost',
      'listCategories',
      'listTeam',
    ] as const)
      expect(typeof source[name], name).toBe('function')
  })

  it('returns independent copies so a consumer cannot corrupt the fixtures', async () => {
    const first = await source.listServices(en)
    // DTOs are readonly for consumers, so the cast is what a misbehaving caller would do.
    ;(first[0] as { title: string }).title = 'changed'
    expect((await source.listServices(en))[0].title).not.toBe('changed')
  })
})

describe('fixture content source: empty contract', () => {
  it('returns [] for empty collections and null for missing single items', async () => {
    expect(await source.getSiteSettings(id)).toBeNull()
    for (const key of PAGE_KEYS) expect(await source.getPage(key, id)).toBeNull()
    expect(await source.listServices(id)).toEqual([])
    expect(await source.getService('ai-discovery', id)).toBeNull()
    expect(await source.getService('does-not-exist', en)).toBeNull()
    expect(await source.listCapabilities(id)).toEqual([])
    expect(await source.listIndustries(id)).toEqual([])
    expect(await source.listFaq('home', id)).toEqual([])
    expect(await source.listFaq('service:does-not-exist', en)).toEqual([])
    expect(await source.listWork({ locale: id })).toEqual([])
    expect(await source.listWork({ locale: en, service: 'does-not-exist' })).toEqual([])
    expect(await source.getWork('does-not-exist', en)).toBeNull()
    expect(await source.listPosts({ locale: id, page: 1, pageSize: 9 })).toEqual({
      posts: [],
      total: 0,
      page: 1,
      pageSize: 9,
    })
    expect(await source.getPost('does-not-exist', en)).toBeNull()
    expect(await source.listCategories(id)).toEqual([])
    expect(await source.listTeam(id)).toEqual([])
  })

  it('represents missing optional content as null, never as placeholder text', async () => {
    const settings = await source.getSiteSettings(en)
    expect(settings).not.toBeNull()
    expect(settings?.social.tiktok).toBeNull()
    expect(settings?.contact.address).toBeNull()
    expect(settings?.contact.legalEntity).toBeNull()
    const contact = await source.getPage('contact', en)
    expect(contact?.responseTimeText).toBeNull()
  })

  it('rejects invalid pagination instead of guessing', async () => {
    await expect(source.listPosts({ locale: en, page: 0, pageSize: 9 })).rejects.toThrow(RangeError)
    await expect(source.listPosts({ locale: en, page: 1, pageSize: 0 })).rejects.toThrow(RangeError)
    await expect(source.listPosts({ locale: en, page: 1.5, pageSize: 9 })).rejects.toThrow(
      RangeError,
    )
  })
})

describe('fixture content source: behaviour', () => {
  it('returns each page keyed by its page key', async () => {
    for (const key of PAGE_KEYS) {
      const page = await source.getPage(key, en)
      expect(page?.key).toBe(key)
      expect(page?.locale).toBe(en)
    }
  })

  it('filters FAQ by tag', async () => {
    const home = await source.listFaq('home', en)
    const product = await source.listFaq('product', en)
    expect(home.length).toBeGreaterThan(0)
    expect(product.length).toBeGreaterThan(0)
    expect(home.map((item) => item.question)).not.toEqual(product.map((item) => item.question))
    const detail = await source.getService('ai-build', en)
    expect(detail).not.toBeNull()
    expect((await source.listFaq('service:ai-build', en)).length).toBeGreaterThan(0)
  })

  it('filters work by service and by featured flag', async () => {
    const all = await source.listWork({ locale: en })
    expect(all).toHaveLength(3)
    const service = all[0].serviceSlug as string
    const byService = await source.listWork({ locale: en, service })
    expect(byService.length).toBeGreaterThan(0)
    expect(byService.every((item) => item.serviceSlug === service)).toBe(true)
    const featured = await source.listWork({ locale: en, featured: true })
    expect(featured.every((item) => item.featured)).toBe(true)
  })

  it('paginates posts newest first and filters by category', async () => {
    const first = await source.listPosts({ locale: en, page: 1, pageSize: 4 })
    const second = await source.listPosts({ locale: en, page: 2, pageSize: 4 })
    const beyond = await source.listPosts({ locale: en, page: 3, pageSize: 4 })
    expect(first.total).toBe(6)
    expect(first.posts).toHaveLength(4)
    expect(second.posts).toHaveLength(2)
    expect(beyond.posts).toEqual([])
    const dates = [...first.posts, ...second.posts].map((post) => post.publishedAt)
    expect(dates).toEqual([...dates].sort().reverse())
    const category = first.posts[0].category?.slug as string
    const filtered = await source.listPosts({ locale: en, category, page: 1, pageSize: 9 })
    expect(filtered.posts.length).toBeGreaterThan(0)
    expect(filtered.posts.every((post) => post.category?.slug === category)).toBe(true)
    expect(filtered.total).toBe(filtered.posts.length)
  })

  it('returns detail DTOs by slug', async () => {
    expect((await source.getService('ai-discovery', en))?.slug).toBe('ai-discovery')
    const [work] = await source.listWork({ locale: en })
    expect((await source.getWork(work.slug, en))?.slug).toBe(work.slug)
    const { posts } = await source.listPosts({ locale: en, page: 1, pageSize: 1 })
    expect((await source.getPost(posts[0].slug, en))?.slug).toBe(posts[0].slug)
  })
})

describe('fixture content source: projections expose only DTO fields', () => {
  it('getSiteSettings', async () => {
    const settings = await source.getSiteSettings(en)
    expect(sorted(settings!)).toEqual(
      [
        'analytics',
        'brand',
        'contact',
        'features',
        'locale',
        'seo',
        'social',
        'verification',
        'whatsapp',
      ].sort(),
    )
    expectSafeProjection(settings, { allowEmail: true })
  })

  it('getPage', async () => {
    for (const key of PAGE_KEYS) {
      const page = await source.getPage(key, en)
      expect(sorted(page!)).toEqual(expect.arrayContaining(['key', 'locale', 'seo']))
      expectSafeProjection(page)
    }
  })

  it('listServices and getService', async () => {
    const list = await source.listServices(en)
    for (const item of list) expect(sorted(item)).toEqual(SERVICE_SUMMARY_KEYS)
    const detail = await source.getService(list[0].slug, en)
    expect(sorted(detail!)).toEqual(
      withSeo([
        ...SERVICE_SUMMARY_KEYS,
        'problems',
        'deliverables',
        'process',
        'tools',
        'ctaLabel',
      ]),
    )
    expectSafeProjection([list, detail])
  })

  it('listCapabilities', async () => {
    const list = await source.listCapabilities(en)
    expect(list.length).toBeGreaterThan(0)
    for (const item of list)
      expect(sorted(item)).toEqual([
        'body',
        'featured',
        'key',
        'mockupLines',
        'pose',
        'tint',
        'title',
      ])
    expectSafeProjection(list)
  })

  it('listIndustries', async () => {
    const list = await source.listIndustries(en)
    expect(list.length).toBeGreaterThan(0)
    for (const item of list) expect(sorted(item)).toEqual(['exampleDay', 'key', 'label'])
    expectSafeProjection(list)
  })

  it('listFaq', async () => {
    const list = await source.listFaq('home', en)
    for (const item of list) expect(sorted(item)).toEqual(['answer', 'question'])
    expectSafeProjection(list)
  })

  it('listWork and getWork', async () => {
    const list = await source.listWork({ locale: en })
    for (const item of list) expect(sorted(item)).toEqual(WORK_SUMMARY_KEYS)
    const detail = await source.getWork(list[0].slug, en)
    expect(sorted(detail!)).toEqual(
      withSeo([...WORK_SUMMARY_KEYS, 'challenge', 'solution', 'result', 'gallery', 'demoUrl']),
    )
    expectSafeProjection([list, detail])
  })

  it('listPosts and getPost', async () => {
    const page = await source.listPosts({ locale: en, page: 1, pageSize: 9 })
    expect(sorted(page)).toEqual(['page', 'pageSize', 'posts', 'total'])
    for (const item of page.posts) expect(sorted(item)).toEqual(POST_SUMMARY_KEYS)
    const detail = await source.getPost(page.posts[0].slug, en)
    expect(sorted(detail!)).toEqual(withSeo([...POST_SUMMARY_KEYS, 'body', 'updatedAt']))
    // The author projection is name/role/photo only: never an email or an internal user id.
    for (const post of page.posts)
      if (post.author) expect(sorted(post.author)).toEqual(['name', 'photo', 'role'])
    expectSafeProjection([page, detail])
  })

  it('listCategories', async () => {
    const list = await source.listCategories(en)
    expect(list.length).toBeGreaterThan(0)
    for (const item of list) expect(sorted(item)).toEqual(['name', 'slug'])
    expectSafeProjection(list)
  })

  it('listTeam', async () => {
    const list = await source.listTeam(en)
    expect(list.length).toBeGreaterThan(0)
    for (const item of list)
      expect(sorted(item)).toEqual(['bio', 'name', 'photo', 'role', 'socialUrl'])
    expectSafeProjection(list)
  })
})
