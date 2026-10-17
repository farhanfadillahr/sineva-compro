import { describe, expect, it } from 'vitest'
import { topicTitle, withTopicTitle } from '@/features/cms/seo-title'
import { launchPage } from '@/features/pages/launch'
import { launchPosts } from '@/features/posts/launch'
import { launchServices } from '@/features/services/launch'

describe('topicTitle', () => {
  it('removes only an exact trailing brand suffix', () => {
    expect(topicTitle('Thank you | Sineva')).toBe('Thank you')
    expect(topicTitle('Thank you')).toBe('Thank you')
    expect(topicTitle('Sineva | Thank you')).toBe('Sineva | Thank you')
    expect(topicTitle('Thank you | Sineva Tech')).toBe('Thank you | Sineva Tech')
  })

  it('keeps the other SEO fields', () => {
    expect(withTopicTitle({ metaTitle: 'About | Sineva', noindex: true })).toEqual({
      metaTitle: 'About',
      noindex: true,
    })
  })
})

// The template adds the brand, so seeded content must not carry it (CPR-104).
describe('launch content seeds topic-only meta titles', () => {
  const seoOf = (data: unknown) => (data as { seo: { metaTitle: string } }).seo.metaTitle

  it('pages', () => {
    for (const locale of ['en', 'id'] as const) {
      const page = launchPage('thankYou', locale)
      expect(seoOf(page)).not.toMatch(/\| Sineva$/)
    }
  })

  it('articles and services', () => {
    for (const post of launchPosts()) expect(seoOf(post.data)).not.toMatch(/\| Sineva$/)
    for (const service of launchServices())
      for (const local of Object.values(service.translations))
        expect(seoOf(local)).not.toMatch(/\| Sineva$/)
  })
})
