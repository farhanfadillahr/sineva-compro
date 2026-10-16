import { describe, expect, it } from 'vitest'
import { staticContent } from '../../src/content/static'
import { findDashViolationsInTree, validatePublicCopy } from '../../src/lib/copy'
import { collectStringLeaves } from '../../src/lib/copy/walk'
import { FIELD_LIMITS, countWords } from '../../src/features/content/limits'
import { PAGE_KEYS } from '../../src/features/content/types'
import { walkObjectsWithKey } from '../fixtures/public/walk'

// Every string the site can show, with its JSON path. Keys are identifiers, not copy. URL-like
// leaves (asset paths) are kept: they must pass the same dash rule and the example.com rule.
const leaves = collectStringLeaves(staticContent)
const copyLeaves = leaves.filter(
  ({ path }) =>
    !/\.(url|type|from|tint|pose|icon|key|slug|locale|target|kind|gradient)$/.test(path),
)

// Button and link labels on pages and services. Industry tab labels are nouns, not CTAs.
const ctaLeaves = leaves.filter(
  ({ path }) => /^(pages|serviceDetails)/.test(path) && /(CtaLabel|ctaLabel|\.label)$/.test(path),
)

describe('static content: copywriting hard rules', () => {
  it('has strings to check', () => {
    expect(leaves.length).toBeGreaterThan(200)
  })

  it('contains no em dash, en dash or look-alike anywhere (shared src/lib/copy rule)', () => {
    expect(findDashViolationsInTree(staticContent)).toEqual([])
    for (const { path, value } of leaves) {
      expect(validatePublicCopy(value).ok, path).toBe(true)
    }
  })

  it('has no empty strings and no placeholder text', () => {
    expect(leaves.filter(({ value }) => value.trim() === '')).toEqual([])
    expect(
      leaves.filter(
        // `{title}` in the SEO title template is the one intentional placeholder.
        ({ path, value }) =>
          path !== 'siteSettings.seo.titleTemplate' &&
          /lorem ipsum|\b(todo|tbd|fixme)\b|\{[a-z ]+\}/i.test(value),
      ),
    ).toEqual([])
  })

  it('has no [Demo] markers and no example.com', () => {
    expect(leaves.filter(({ value }) => /\[demo\]/i.test(value))).toEqual([])
    expect(leaves.filter(({ value }) => /example\.com/i.test(value))).toEqual([])
  })

  it('never says "Sineva Tech" and keeps the brand spelling', () => {
    expect(leaves.filter(({ value }) => /sineva tech/i.test(value))).toEqual([])
    // "Sino" is a name: a lowercase "sino" in copy is a typo (asset paths are not copy).
    expect(copyLeaves.filter(({ value }) => /\bsino\b/.test(value))).toEqual([])
  })

  it('invents no metrics: no percentages, multipliers, speed claims or ratings', () => {
    const metric =
      /\d\s?%|\bpercent\b|\b\d+(?:\.\d+)?\s?x\b|\btimes (?:faster|more|better)\b|\b\d+x faster\b|\bfaster than\b|\d[\d,.]*\+|\b\d+(?:\.\d+)?\s?\/\s?5\b|\b(?:star|stars) rating\b|\bRp\s?\d|\bIDR\b|\$\s?\d/i
    expect(leaves.filter(({ value }) => metric.test(value))).toEqual([])
  })

  it('has no testimonials, client logos, ratings, certifications or award claims', () => {
    const claim =
      /\btestimonial|\bclient logo|\btrusted by\b|\bloved by\b|\bcertified\b|\biso ?27001\b|\baward|\b#1\b|\bbest[- ]in[- ]class\b|\b5-star\b|\bour clients say\b/i
    expect(leaves.filter(({ value }) => claim.test(value))).toEqual([])
  })

  it('avoids the hype and jargon words the voice guide bans', () => {
    const banned =
      /\b(leverage|synergy|synergies|cutting-edge|revolutioni[sz]e|revolutionary|game-changer|game-changing|next-generation|world-class|disrupt\w*|supercharge\w*|10x)\b/i
    expect(leaves.filter(({ value }) => banned.test(value))).toEqual([])
  })

  it('makes no business-result promises', () => {
    const promise =
      /\b(guarantee[sd]?|double your|triple your|increase (?:your )?(?:sales|revenue)|boost (?:your )?(?:sales|revenue)|cut (?:your )?costs|save (?:you )?\d)/i
    expect(leaves.filter(({ value }) => promise.test(value))).toEqual([])
  })
})

describe('static content: product claims stay inside what is confirmed', () => {
  const productCopy = [
    ...collectStringLeaves(staticContent.pages.product, 'product'),
    ...collectStringLeaves(staticContent.capabilities, 'capabilities'),
    ...collectStringLeaves(staticContent.industries, 'industries'),
  ].filter(({ path }) => !/\.(tint|pose|icon|key|from)$/.test(path))

  it('claims no messaging channel or integration', () => {
    const channels =
      /whatsapp|instagram|\big\b|tiktok|telegram|facebook|messenger|line app|shopee|tokopedia|gmail|email inbox|slack|zapier|integrat|api\b|plug-?in|connect (?:your|to)/i
    expect(productCopy.filter(({ value }) => channels.test(value))).toEqual([])
  })

  it('states no price, plan, date or launch quarter', () => {
    const commercial =
      /\b(price|pricing|per month|monthly|subscription|free trial|plan costs?|cheap|affordable)\b|\b20\d\d\b|\bq[1-4]\b|\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\b|\bnext (?:week|month|year)\b|\bsoon\b.*\b(?:on|by)\b/i
    expect(productCopy.filter(({ value }) => commercial.test(value))).toEqual([])
  })

  it('does not read like financial advice', () => {
    const advice = /\b(invest|investment|tax advice|should (?:buy|sell)|profit forecast)\b/i
    expect(productCopy.filter(({ value }) => advice.test(value))).toEqual([])
    const finance = staticContent.capabilities.find((item) => item.key === 'finance-admin')
    expect(finance?.body.toLowerCase()).toContain('not financial advice')
  })
})

describe('static content: metadata limits', () => {
  const seoBlocks = [...walkObjectsWithKey(staticContent, 'metaTitle')] as {
    metaTitle: string
    metaDescription: string
    ogImage: unknown
    canonicalUrl: string | null
  }[]

  it('covers every page and every service and post', () => {
    expect(seoBlocks.length).toBe(PAGE_KEYS.length + 3 + 3)
  })

  it('keeps meta titles within 60 and descriptions within 160 characters', () => {
    for (const seo of seoBlocks) {
      expect(seo.metaTitle.length, seo.metaTitle).toBeLessThanOrEqual(FIELD_LIMITS.metaTitleChars)
      expect(seo.metaTitle.length, seo.metaTitle).toBeGreaterThan(10)
      expect(seo.metaDescription.length, seo.metaDescription).toBeLessThanOrEqual(
        FIELD_LIMITS.metaDescriptionChars,
      )
      expect(seo.metaDescription.length, seo.metaDescription).toBeGreaterThanOrEqual(60)
    }
  })

  it('follows the "{topic} | Sineva" title pattern', () => {
    for (const seo of seoBlocks)
      expect(seo.metaTitle.endsWith(' | Sineva'), seo.metaTitle).toBe(true)
  })

  it('has unique titles and descriptions so no two pages compete in search', () => {
    expect(new Set(seoBlocks.map((seo) => seo.metaTitle)).size).toBe(seoBlocks.length)
    expect(new Set(seoBlocks.map((seo) => seo.metaDescription)).size).toBe(seoBlocks.length)
  })

  it('ends every description with a sentence, as the metadata rule asks', () => {
    for (const seo of seoBlocks) expect(seo.metaDescription, seo.metaTitle).toMatch(/[.?!]$/)
  })

  it('leaves canonical and OG overrides to the route', () => {
    for (const seo of seoBlocks) {
      expect(seo.canonicalUrl).toBeNull()
      expect(seo.ogImage).toBeNull()
    }
  })
})

describe('static content: slugs and structure', () => {
  const kebab = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

  it('uses unique kebab-case slugs for services, posts and categories', () => {
    const groups = {
      services: staticContent.services.map((item) => item.slug),
      posts: staticContent.posts.map((item) => item.slug),
      categories: staticContent.categories.map((item) => item.slug),
      capabilities: staticContent.capabilities.map((item) => item.key),
      industries: staticContent.industries.map((item) => item.key),
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

  it('keeps every headline inside the word limits and every CTA label at 2 to 4 words', () => {
    const headlines = [...walkObjectsWithKey(staticContent.pages, 'headline')] as {
      headline: string
    }[]
    expect(headlines.length).toBeGreaterThan(5)
    for (const block of headlines) {
      expect(countWords(block.headline), block.headline).toBeLessThanOrEqual(
        FIELD_LIMITS.heroHeadlineWords,
      )
    }
    const ctas = ctaLeaves
    expect(ctas.length).toBeGreaterThan(5)
    for (const { path, value } of ctas) {
      expect(countWords(value), `${path}: ${value}`).toBeGreaterThanOrEqual(
        FIELD_LIMITS.ctaLabelWordsMin,
      )
      expect(countWords(value), `${path}: ${value}`).toBeLessThanOrEqual(
        FIELD_LIMITS.ctaLabelWordsMax,
      )
    }
  })

  it('keeps string body copy on pages within the body word limit', () => {
    const bodies = [...walkObjectsWithKey(staticContent.pages, 'body')] as { body: unknown }[]
    expect(bodies.length).toBeGreaterThan(5)
    for (const block of bodies) {
      if (typeof block.body === 'string')
        expect(countWords(block.body), block.body).toBeLessThanOrEqual(FIELD_LIMITS.bodyWords)
    }
  })

  it('writes eyebrows within three words', () => {
    const eyebrows = leaves.filter(({ path }) => path.endsWith('eyebrow'))
    expect(eyebrows.length).toBeGreaterThan(0)
    for (const { path, value } of eyebrows) {
      expect(countWords(value), `${path}: ${value}`).toBeLessThanOrEqual(FIELD_LIMITS.eyebrowWords)
    }
  })

  it('uses sentence case in headlines: no Title Case runs', () => {
    const headlines = leaves.filter(({ path }) => /headline$/.test(path))
    for (const { path, value } of headlines) {
      // Three or more consecutive capitalised words is Title Case. Brand and service names are
      // allowed to be capitalised, so only runs of ordinary words are flagged.
      const words = value.replace(/AI (Discovery|Build|Enablement)|Sineva|Sino/g, 'x').split(' ')
      let run = 0
      for (const word of words.slice(1)) {
        run = /^[A-Z][a-z]+$/.test(word) ? run + 1 : 0
        expect(run, `${path}: ${value}`).toBeLessThan(2)
      }
    }
  })

  it('uses first-person plural and second person, never a CTA from the banned list', () => {
    const banned = /^(submit|click here|learn more|read more|sign up now!*|whatsapp)$/i
    const ctas = ctaLeaves
    expect(ctas.filter(({ value }) => banned.test(value.trim()))).toEqual([])
  })
})
