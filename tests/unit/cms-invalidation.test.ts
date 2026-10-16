import { describe, expect, it } from 'vitest'
import { invalidationTags } from '../../src/features/cms/invalidation'

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

  it('maps every entity to the tags its public reads use', () => {
    expect(invalidationTags({ entity: 'service', slugs: ['ai-build'] })).toEqual([
      'services:en',
      'service:ai-build:en',
      'sitemap',
    ])
    expect(invalidationTags({ entity: 'work', slugs: [null, 'demo'] })).toEqual([
      'work:en',
      'work-item:demo:en',
      'sitemap',
    ])
    expect(invalidationTags({ entity: 'page', key: 'home' })).toEqual(['page:home:en', 'sitemap'])
    expect(invalidationTags({ entity: 'settings' })).toEqual(['settings', 'sitemap'])
    expect(invalidationTags({ entity: 'team' })).toEqual(['team:en', 'posts:en'])
    expect(invalidationTags({ entity: 'categories' })).toEqual(['categories:en', 'posts:en'])
    expect(invalidationTags({ entity: 'faq' })).toEqual(['faq:en'])
    expect(invalidationTags({ entity: 'capabilities' })).toEqual(['capabilities:en'])
    expect(invalidationTags({ entity: 'industries' })).toEqual(['industries:en'])
  })

  it('ignores invalid slugs instead of building ambiguous tags', () => {
    expect(invalidationTags({ entity: 'post', slugs: ['Bad:Slug', undefined] })).toEqual([
      'posts:en',
      'sitemap',
    ])
  })
})
