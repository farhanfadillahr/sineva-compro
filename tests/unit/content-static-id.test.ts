import { describe, expect, it } from 'vitest'
import { staticContent, staticContentId } from '../../src/content/static'
import { collectionSeedData } from '../../src/features/collections/seed-data'
import { FIELD_LIMITS } from '../../src/features/content/limits'
import { PAGE_KEYS } from '../../src/features/content/types'
import { findDashViolationsInTree, validatePublicCopy } from '../../src/lib/copy'
import { collectStringLeaves } from '../../src/lib/copy/walk'
import { walkObjectsWithKey } from '../fixtures/public/walk'

// The Indonesian launch content (CPR-101). The English-only word lists of content-static-copy
// (hype words, metric phrasing) do not translate one to one, so this file checks the rules that
// hold in any language, plus that the Indonesian bundle never drifts from the English structure.
const leaves = collectStringLeaves(staticContentId)
const NON_COPY =
  /\.(url|type|from|tint|pose|icon|key|slug|locale|target|kind|gradient|effectiveDate)$/
const copyLeaves = leaves.filter(({ path }) => !NON_COPY.test(path))

/** Paths of every leaf, with array indexes kept: same paths means same shape and list lengths. */
const shape = (value: unknown) => collectStringLeaves(value).map(({ path }) => path)

describe('Indonesian static content: copy rules', () => {
  it('has no em dash, en dash or look-alike, and passes the shared copy rule', () => {
    expect(findDashViolationsInTree(staticContentId)).toEqual([])
    for (const { path, value } of leaves) expect(validatePublicCopy(value).ok, path).toBe(true)
  })

  it('has no empty strings, placeholders or demo markers', () => {
    expect(leaves.filter(({ value }) => value.trim() === '')).toEqual([])
    expect(
      leaves.filter(
        ({ path, value }) =>
          path !== 'siteSettings.seo.titleTemplate' &&
          /lorem ipsum|\b(todo|tbd|fixme)\b|\{[a-z ]+\}|\[demo\]/i.test(value),
      ),
    ).toEqual([])
  })

  it('keeps the brand spelling', () => {
    expect(leaves.filter(({ value }) => /sineva tech/i.test(value))).toEqual([])
    expect(copyLeaves.filter(({ value }) => /\bsino\b/.test(value))).toEqual([])
  })

  it('invents no metrics, prices or dates', () => {
    expect(
      copyLeaves.filter(({ value }) =>
        /\d\s?%|\bpersen\b|\bRp\s?\d|\bIDR\b|\b20\d\d\b/i.test(value),
      ),
    ).toEqual([])
  })

  it('claims no messaging channel or integration for the product', () => {
    const productCopy = [
      ...collectStringLeaves(staticContentId.pages.product, 'product'),
      ...collectStringLeaves(staticContentId.capabilities, 'capabilities'),
      ...collectStringLeaves(staticContentId.industries, 'industries'),
    ].filter(({ path }) => !NON_COPY.test(path))
    const channels =
      /whatsapp|instagram|tiktok|telegram|facebook|shopee|tokopedia|gmail|slack|zapier|integrasi|\bapi\b|plugin/i
    expect(productCopy.filter(({ value }) => channels.test(value))).toEqual([])
    const finance = staticContentId.capabilities.find((item) => item.key === 'finance-admin')
    expect(finance?.body).toContain('bukan nasihat keuangan')
  })
})

describe('Indonesian static content: metadata', () => {
  const seoBlocks = [...walkObjectsWithKey(staticContentId, 'metaTitle')] as {
    metaTitle: string
    metaDescription: string
  }[]

  it('covers every page and service (no Indonesian posts yet)', () => {
    expect(seoBlocks.length).toBe(PAGE_KEYS.length + 3)
  })

  it('keeps titles within 60 and descriptions within 160 characters, as "... | Sineva"', () => {
    for (const { metaTitle, metaDescription } of seoBlocks) {
      expect(metaTitle.length, metaTitle).toBeLessThanOrEqual(FIELD_LIMITS.metaTitleChars)
      expect(metaTitle.endsWith(' | Sineva'), metaTitle).toBe(true)
      expect(metaDescription.length, metaDescription).toBeLessThanOrEqual(
        FIELD_LIMITS.metaDescriptionChars,
      )
      expect(metaDescription.length, metaDescription).toBeGreaterThanOrEqual(60)
      expect(metaDescription, metaTitle).toMatch(/[.?!]$/)
    }
  })

  it('has unique titles and descriptions', () => {
    expect(new Set(seoBlocks.map((seo) => seo.metaTitle)).size).toBe(seoBlocks.length)
    expect(new Set(seoBlocks.map((seo) => seo.metaDescription)).size).toBe(seoBlocks.length)
  })
})

describe('Indonesian static content: same structure as English', () => {
  it.each(PAGE_KEYS)('page %s has the same fields, lists and switches', (key) => {
    const en = staticContent.pages[key]
    const id = staticContentId.pages[key]
    expect(id.locale).toBe('id')
    expect(shape(id)).toEqual(shape(en))
  })

  it('translates every service with the same slug, icon, pose and tools', () => {
    expect(staticContentId.serviceDetails.map((s) => s.locale)).toEqual(['id', 'id', 'id'])
    staticContentId.serviceDetails.forEach((id, i) => {
      const en = staticContent.serviceDetails[i]
      expect({ slug: id.slug, icon: id.icon, pose: id.pose, tools: id.tools }).toEqual({
        slug: en.slug,
        icon: en.icon,
        pose: en.pose,
        tools: en.tools,
      })
      expect(shape(id)).toEqual(shape(en))
    })
  })

  it('translates every FAQ, capability and business type, keeping tags and keys', () => {
    expect(staticContentId.faq.map((e) => e.tags)).toEqual(staticContent.faq.map((e) => e.tags))
    expect(staticContentId.capabilities.map((c) => c.key)).toEqual(
      staticContent.capabilities.map((c) => c.key),
    )
    expect(staticContentId.industries.map((c) => c.key)).toEqual(
      staticContent.industries.map((c) => c.key),
    )
  })

  it('keeps the facts of site settings and translates the WhatsApp messages', () => {
    const { siteSettings: id } = staticContentId
    const { siteSettings: en } = staticContent
    expect(id.locale).toBe('id')
    expect(id.whatsapp.number).toBe(en.whatsapp.number)
    expect(id.social).toEqual(en.social)
    expect(id.features).toEqual(en.features)
    expect(id.whatsapp.templates.services.map((t) => t.serviceSlug)).toEqual(
      en.whatsapp.templates.services.map((t) => t.serviceSlug),
    )
    expect(id.whatsapp.templates.general).not.toBe(en.whatsapp.templates.general)
  })

  it('seeds the Indonesian copy of every launch collection row', () => {
    for (const name of ['capabilities', 'businessTypes', 'faq'] as const)
      for (const row of collectionSeedData[name].launch())
        expect(row.translations?.id, `${name} ${row.key}`).toBeDefined()
  })
})
