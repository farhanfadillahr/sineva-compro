import { describe, expect, it } from 'vitest'
import { cacheTags } from '../../src/lib/cache/tags'
import { PAGE_KEYS } from '../../src/features/content/types'

// 'id' is the second enabled locale in routing, so it doubles as the "fixture second locale".
const locales = ['en', 'id'] as const

describe('cache tags', () => {
  it('uses the documented literal shapes for the English locale', () => {
    expect(cacheTags.settings).toBe('settings')
    expect(cacheTags.sitemap).toBe('sitemap')
    expect(cacheTags.page('home', 'en')).toBe('page:home:en')
    expect(cacheTags.services('en')).toBe('services:en')
    expect(cacheTags.service('ai-discovery', 'en')).toBe('service:ai-discovery:en')
    expect(cacheTags.capabilities('en')).toBe('capabilities:en')
    expect(cacheTags.industries('en')).toBe('industries:en')
    expect(cacheTags.faq('en')).toBe('faq:en')
    expect(cacheTags.work('en')).toBe('work:en')
    expect(cacheTags.workItem('demo-chat-assistant', 'en')).toBe('work-item:demo-chat-assistant:en')
    expect(cacheTags.posts('en')).toBe('posts:en')
    expect(cacheTags.post('demo-first-steps', 'en')).toBe('post:demo-first-steps:en')
    expect(cacheTags.categories('en')).toBe('categories:en')
    expect(cacheTags.team('en')).toBe('team:en')
  })

  it.each(locales)('builds every locale-scoped tag for %s', (locale) => {
    const tags = [
      ...PAGE_KEYS.map((key) => cacheTags.page(key, locale)),
      cacheTags.services(locale),
      cacheTags.service('ai-build', locale),
      cacheTags.capabilities(locale),
      cacheTags.industries(locale),
      cacheTags.faq(locale),
      cacheTags.work(locale),
      cacheTags.workItem('demo-chat-assistant', locale),
      cacheTags.posts(locale),
      cacheTags.post('demo-first-steps', locale),
      cacheTags.categories(locale),
      cacheTags.team(locale),
    ]
    expect(tags.every((tag) => tag.endsWith(`:${locale}`))).toBe(true)
    expect(new Set(tags).size).toBe(tags.length)
  })

  it('is deterministic and never collides across locales or entities', () => {
    expect(cacheTags.page('home', 'en')).toBe(cacheTags.page('home', 'en'))
    expect(cacheTags.page('home', 'en')).not.toBe(cacheTags.page('home', 'id'))
    // A list tag must never equal an item tag, otherwise revalidating one hits the other.
    expect(cacheTags.work('en')).not.toBe(cacheTags.workItem('en', 'id'))
    expect(cacheTags.services('en')).not.toBe(cacheTags.service('en', 'id'))
  })

  it.each(['Bad Slug', 'a:b', '', 'UPPER', 'trailing-', '-leading'])(
    'rejects the ambiguous slug %j',
    (slug) => {
      expect(() => cacheTags.service(slug, 'en')).toThrow(RangeError)
      expect(() => cacheTags.workItem(slug, 'en')).toThrow(RangeError)
      expect(() => cacheTags.post(slug, 'en')).toThrow(RangeError)
    },
  )
})
