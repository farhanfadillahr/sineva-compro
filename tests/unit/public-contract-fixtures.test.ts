import { describe, expect, it } from 'vitest'
import { publicFixtures } from '../fixtures/public'
import { walkObjectsWithKey, walkStrings } from '../fixtures/public/walk'
import { FIELD_LIMITS, countWords } from '../../src/features/content/limits'
import {
  OPTIONAL_PAGE_SECTIONS,
  PAGE_KEYS,
  POSE_KEYS,
  ICON_KEYS,
  type PageKey,
} from '../../src/features/content/types'

const kebab = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

describe('public fixtures: copy rules', () => {
  it('contain no em dash (U+2014) or en dash (U+2013) anywhere', () => {
    const offenders = [...walkStrings(publicFixtures)].filter((text) => /[–—]/.test(text))
    expect(offenders).toEqual([])
  })

  it('contain no empty or placeholder strings', () => {
    const strings = [...walkStrings(publicFixtures)]
    expect(strings.filter((text) => text.trim() === '')).toEqual([])
    expect(strings.filter((text) => /lorem ipsum|\b(todo|tbd)\b/i.test(text))).toEqual([])
  })

  it('keep meta title within 60 and meta description within 160 characters', () => {
    expect(FIELD_LIMITS.metaTitleChars).toBe(60)
    expect(FIELD_LIMITS.metaDescriptionChars).toBe(160)
    const seoBlocks = [...walkObjectsWithKey(publicFixtures, 'metaTitle')] as {
      metaTitle: string
      metaDescription: string
    }[]
    expect(seoBlocks.length).toBeGreaterThanOrEqual(PAGE_KEYS.length)
    for (const seo of seoBlocks) {
      expect(seo.metaTitle.length).toBeLessThanOrEqual(60)
      expect(seo.metaDescription.length).toBeLessThanOrEqual(160)
      expect(seo.metaTitle.endsWith(' | Sineva')).toBe(true)
    }
  })

  it('keep headlines and body copy inside the copywriting word limits', () => {
    for (const block of walkObjectsWithKey(publicFixtures.pages, 'headline') as {
      headline: string
    }[]) {
      expect(countWords(block.headline)).toBeLessThanOrEqual(FIELD_LIMITS.heroHeadlineWords)
    }
    for (const block of walkObjectsWithKey(publicFixtures.pages, 'body') as { body: unknown }[]) {
      if (typeof block.body === 'string')
        expect(countWords(block.body)).toBeLessThanOrEqual(FIELD_LIMITS.bodyWords)
    }
  })

  it('use example.com addresses, E.164 WhatsApp numbers and example.com URLs only', () => {
    const strings = [...walkStrings(publicFixtures)]
    const emails = strings.filter((text) => /^[^\s@]+@[^\s@]+$/.test(text))
    expect(emails.length).toBeGreaterThan(0)
    expect(emails.filter((email) => !email.endsWith('@example.com'))).toEqual([])
    const urls = strings.filter((text) => /^https?:\/\//.test(text))
    expect(urls.length).toBeGreaterThan(0)
    for (const url of urls) {
      const host = new URL(url).hostname
      expect(host === 'example.com' || host.endsWith('.example.com')).toBe(true)
    }
    expect(publicFixtures.siteSettings.whatsapp.number).toMatch(/^\+[1-9]\d{7,14}$/)
  })
})

describe('public fixtures: structure', () => {
  it('provide a page fixture for every page key', () => {
    expect(Object.keys(publicFixtures.pages).sort()).toEqual([...PAGE_KEYS].sort())
    for (const key of PAGE_KEYS) {
      expect(publicFixtures.pages[key].key).toBe(key)
      expect(publicFixtures.pages[key].locale).toBe('en')
    }
  })

  it('give every optional page section an explicit visible flag', () => {
    for (const key of PAGE_KEYS) {
      const page = publicFixtures.pages[key] as unknown as Record<string, { visible?: unknown }>
      for (const section of OPTIONAL_PAGE_SECTIONS[key as PageKey]) {
        expect(typeof page[section]?.visible, `${key}.${section}.visible`).toBe('boolean')
      }
    }
  })

  it('use kebab-case slugs, unique per entity', () => {
    const groups = {
      services: publicFixtures.services.map((item) => item.slug),
      work: publicFixtures.work.map((item) => item.slug),
      posts: publicFixtures.posts.map((item) => item.slug),
      categories: publicFixtures.categories.map((item) => item.slug),
    }
    for (const [group, slugs] of Object.entries(groups)) {
      expect(slugs.length, group).toBeGreaterThan(0)
      expect(
        slugs.filter((slug) => !kebab.test(slug)),
        group,
      ).toEqual([])
      expect(new Set(slugs).size, group).toBe(slugs.length)
    }
  })

  it('mirror the demo seed counts: 3 services, 3 work items, 6 posts', () => {
    expect(publicFixtures.services).toHaveLength(3)
    expect(publicFixtures.work).toHaveLength(3)
    expect(publicFixtures.posts).toHaveLength(6)
  })

  it('prefix every work and post title with [Demo] and mark work as internal demos', () => {
    for (const item of [
      ...publicFixtures.work,
      ...publicFixtures.workDetails,
      ...publicFixtures.posts,
      ...publicFixtures.postDetails,
    ]) {
      expect(item.title.startsWith('[Demo] ')).toBe(true)
    }
    for (const item of [...publicFixtures.work, ...publicFixtures.workDetails]) {
      expect(item.projectType).toBe('internal-demo')
    }
  })

  it('keep summaries and details aligned by slug', () => {
    expect(publicFixtures.serviceDetails.map((item) => item.slug)).toEqual(
      publicFixtures.services.map((item) => item.slug),
    )
    expect(publicFixtures.workDetails.map((item) => item.slug)).toEqual(
      publicFixtures.work.map((item) => item.slug),
    )
    expect(publicFixtures.postDetails.map((item) => item.slug)).toEqual(
      publicFixtures.posts.map((item) => item.slug),
    )
  })

  it('reference only declared pose and icon keys and known categories and services', () => {
    const poses = new Set<string>(POSE_KEYS)
    const icons = new Set<string>(ICON_KEYS)
    for (const block of walkObjectsWithKey(publicFixtures, 'pose') as { pose: string }[])
      expect(poses.has(block.pose)).toBe(true)
    for (const block of walkObjectsWithKey(publicFixtures, 'icon') as { icon: string }[])
      expect(icons.has(block.icon)).toBe(true)
    const serviceSlugs = new Set(publicFixtures.services.map((item) => item.slug))
    for (const item of publicFixtures.work)
      if (item.serviceSlug !== null) expect(serviceSlugs.has(item.serviceSlug)).toBe(true)
    const categorySlugs = new Set(publicFixtures.categories.map((item) => item.slug))
    for (const item of publicFixtures.posts)
      if (item.category !== null) expect(categorySlugs.has(item.category.slug)).toBe(true)
  })

  it('keep capability and industry limits from the content inventory', () => {
    for (const capability of publicFixtures.capabilities)
      expect(capability.mockupLines.length).toBeLessThanOrEqual(FIELD_LIMITS.mockupLines)
    expect(publicFixtures.industries.length).toBeLessThanOrEqual(FIELD_LIMITS.industries)
  })

  it('tag every FAQ item for at least one page and cover home, product and services', () => {
    const tags = new Set(publicFixtures.faq.flatMap((entry) => entry.tags))
    for (const tag of ['home', 'product', 'services'] as const) expect(tags.has(tag)).toBe(true)
    for (const entry of publicFixtures.faq) expect(entry.tags.length).toBeGreaterThan(0)
  })
})
