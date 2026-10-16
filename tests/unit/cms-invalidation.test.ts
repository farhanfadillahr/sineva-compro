import { describe, expect, it } from 'vitest'
import { invalidationTags } from '../../src/features/cms/invalidation'

const EN = ['en'] as const

describe('invalidationTags', () => {
  it('refreshes the old and new item, the list and the sitemap on a slug rename, in every locale', () => {
    expect(
      invalidationTags({ entity: 'post', slugs: ['old-name', 'new-name'] }, ['en', 'id'] as never),
    ).toEqual(
      expect.arrayContaining([
        'posts:en',
        'post:old-name:en',
        'post:new-name:en',
        'posts:id',
        'post:old-name:id',
        'post:new-name:id',
        'sitemap',
      ]),
    )
  })

  it('maps every entity to the tags its public reads use (one locale)', () => {
    expect(invalidationTags({ entity: 'service', slugs: ['ai-build'] }, EN)).toEqual([
      'services:en',
      'service:ai-build:en',
      'sitemap',
    ])
    expect(invalidationTags({ entity: 'work', slugs: [null, 'demo'] }, EN)).toEqual([
      'work:en',
      'work-item:demo:en',
      'sitemap',
    ])
    expect(invalidationTags({ entity: 'page', key: 'home' }, EN)).toEqual([
      'page:home:en',
      'sitemap',
    ])
    expect(invalidationTags({ entity: 'settings' }, EN)).toEqual(['settings', 'sitemap'])
    expect(invalidationTags({ entity: 'team' }, EN)).toEqual(['team:en', 'posts:en'])
    expect(invalidationTags({ entity: 'categories' }, EN)).toEqual(['categories:en', 'posts:en'])
    expect(invalidationTags({ entity: 'faq' }, EN)).toEqual(['faq:en'])
    expect(invalidationTags({ entity: 'capabilities' }, EN)).toEqual(['capabilities:en'])
    expect(invalidationTags({ entity: 'industries' }, EN)).toEqual(['industries:en'])
  })

  it('builds the locale tags of every enabled locale by default', () => {
    expect(invalidationTags({ entity: 'service', slugs: ['ai-build'] })).toEqual([
      'services:en',
      'service:ai-build:en',
      'sitemap',
      'services:id',
      'service:ai-build:id',
    ])
    expect(invalidationTags({ entity: 'settings' })).toEqual(['settings', 'sitemap'])
  })

  it('ignores invalid slugs instead of building ambiguous tags', () => {
    expect(invalidationTags({ entity: 'post', slugs: ['Bad:Slug', undefined] }, EN)).toEqual([
      'posts:en',
      'sitemap',
    ])
  })
})
