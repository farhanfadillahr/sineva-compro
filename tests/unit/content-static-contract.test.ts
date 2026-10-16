import { describe, expect, it } from 'vitest'
import { createStaticContentSource, staticContent } from '../../src/content/static'
import { getContentSource } from '../../src/lib/content-source'
import { FIELD_LIMITS } from '../../src/features/content/limits'
import {
  ICON_KEYS,
  OPTIONAL_PAGE_SECTIONS,
  PAGE_KEYS,
  POSE_KEYS,
  type FaqTag,
} from '../../src/features/content/types'
import { walkObjectsWithKey } from '../fixtures/public/walk'

const source = createStaticContentSource()
const SERVICE_SLUGS = ['ai-discovery', 'ai-build', 'ai-enablement']

describe('static content source: wiring', () => {
  it('is what the landing site gets from getContentSource', async () => {
    const wired = await getContentSource().getPage('home', 'en')
    expect(wired).toEqual(await source.getPage('home', 'en'))
    // The fixture source would return "[Demo]" work and posts: none may leak into the site.
    const posts = await getContentSource().listPosts({ locale: 'en', page: 1, pageSize: 20 })
    expect(posts.posts.some((post) => post.title.startsWith('[Demo]'))).toBe(false)
  })

  it('returns copies so one caller cannot change what the next one sees', async () => {
    const first = await source.getSiteSettings('en')
    ;(first as { brand: { siteName: string } }).brand.siteName = 'Changed'
    expect((await source.getSiteSettings('en'))?.brand.siteName).toBe('Sineva')
  })
})

describe('static content source: site settings', () => {
  it('carries only confirmed facts and leaves the rest null', async () => {
    const settings = await source.getSiteSettings('en')
    expect(settings?.locale).toBe('en')
    expect(settings?.brand.siteName).toBe('Sineva')
    expect(settings?.whatsapp.number).toBe('+6285199368510')
    expect(settings?.contact).toEqual({
      email: null,
      businessHours: null,
      address: null,
      legalEntity: null,
    })
    // Instagram is the only confirmed social account.
    expect(settings?.social).toEqual({
      instagram: 'https://www.instagram.com/sineva.tech/',
      linkedin: null,
      tiktok: null,
      youtube: null,
      x: null,
    })
    expect(settings?.verification.googleSearchConsoleToken).toBeNull()
  })

  it('stores the confirmed WhatsApp number as E.164 and the Instagram profile URL', async () => {
    const settings = await source.getSiteSettings('en')
    // The Founder gave 085199368510, the national form: drop the 0, prefix the country code 62.
    expect(settings?.whatsapp.number).toBe('+6285199368510')
    expect(settings?.whatsapp.number).toMatch(/^\+[1-9]\d{7,14}$/)
    expect(settings?.social.instagram).toBe('https://www.instagram.com/sineva.tech/')
    expect(new URL(settings!.social.instagram!).hostname).toBe('www.instagram.com')
  })

  it('sets the launch feature flags', async () => {
    const settings = await source.getSiteSettings('en')
    expect(settings?.features).toEqual({
      showTeam: false,
      showSelectedWork: false,
      enableLogoIntro: true,
      enableRealtimeSino: true,
      enableStickyCtaBar: true,
    })
  })

  it('has a general, product, thank-you and one message per service, all usable', async () => {
    const { whatsapp } = (await source.getSiteSettings('en'))!
    expect(whatsapp.templates.general).toBe(
      "Hi Sineva, I'd like to talk about using AI in my business.",
    )
    expect(whatsapp.templates.product).toBe(
      "Hi Sineva, I'd like to know more about Sineva AI Agents.",
    )
    expect(whatsapp.templates.thankYou).toBe(
      'Hi Sineva, I just sent the contact form and would like a faster reply.',
    )
    const services = await source.listServices('en')
    expect(whatsapp.templates.services.map((item) => item.serviceSlug)).toEqual(
      services.map((item) => item.slug),
    )
    for (const entry of whatsapp.templates.services) {
      const service = services.find((item) => item.slug === entry.serviceSlug)!
      expect(entry.message).toContain(service.title)
      // A literal placeholder would reach the visitor as braces.
      expect(entry.message).not.toMatch(/[{}]/)
    }
  })

  it('points the default OG image at the assets lane path', async () => {
    const settings = await source.getSiteSettings('en')
    expect(settings?.brand.defaultOgImage).toMatchObject({
      url: '/og/default.png',
      width: 1200,
      height: 630,
    })
    expect(settings?.brand.defaultOgImage?.alt.length).toBeGreaterThan(0)
  })
})

describe('static content source: pages', () => {
  it('has a page for every key, in English', async () => {
    for (const key of PAGE_KEYS) {
      const page = await source.getPage(key, 'en')
      expect(page?.key).toBe(key)
      expect(page?.locale).toBe('en')
    }
  })

  it('gives every optional section an explicit visible flag', async () => {
    for (const key of PAGE_KEYS) {
      const page = (await source.getPage(key, 'en')) as unknown as Record<
        string,
        { visible?: unknown }
      >
      for (const section of OPTIONAL_PAGE_SECTIONS[key]) {
        expect(typeof page[section]?.visible, `${key}.${section}`).toBe('boolean')
      }
    }
  })

  it('hides every Selected work and team section while there is nothing real to show', async () => {
    const home = await source.getPage('home', 'en')
    const services = await source.getPage('servicesOverview', 'en')
    const about = await source.getPage('about', 'en')
    expect(home?.selectedWork.visible).toBe(false)
    expect(services?.selectedWork.visible).toBe(false)
    expect(about?.team.visible).toBe(false)
  })

  it('keeps the product in coming soon with the hidden comparison', async () => {
    const product = await source.getPage('product', 'en')
    expect(product?.productStatus).toBe('coming_soon')
    expect(product?.comparison.visible).toBe(false)
    expect(product?.hero.mockup.bubbles.length).toBeLessThanOrEqual(FIELD_LIMITS.mockupBubbles)
    expect(product?.hero.mockup.chips.length).toBeLessThanOrEqual(FIELD_LIMITS.mockupChips)
  })

  it('keeps the contact page honest: no SLA and at most three chips', async () => {
    const contact = await source.getPage('contact', 'en')
    expect(contact?.responseTimeText).toBeNull()
    expect(contact?.metaChips.length).toBeLessThanOrEqual(FIELD_LIMITS.contactChips)
    expect(contact?.steps).toHaveLength(3)
  })

  it('marks the thank-you, 404 and (empty) work pages noindex, and every other page indexable', async () => {
    for (const key of PAGE_KEYS) {
      const page = await source.getPage(key, 'en')
      expect(page?.seo.noindex, key).toBe(['thankYou', 'notFound', 'workIndex'].includes(key))
    }
  })

  it('serves the home hero poster from the assets lane path', async () => {
    const home = await source.getPage('home', 'en')
    expect(home?.hero.poster).toMatchObject({
      url: '/mascot/poster/sino-hero.webp',
      width: 1600,
      height: 1600,
    })
    expect(home?.hero.poster?.alt.length).toBeGreaterThan(0)
  })

  it('has a privacy policy with an ISO effective date and a rich text body', async () => {
    const privacy = await source.getPage('privacy', 'en')
    expect(privacy?.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(privacy?.body.type).toBe('doc')
    const headings = privacy!.body.content.filter((node) => node.type === 'heading')
    // Structure of the reviewed draft: the section headings stay.
    expect(headings.length).toBeGreaterThanOrEqual(8)
  })
})

describe('static content source: services', () => {
  it('lists AI Discovery, AI Build and AI Enablement in order', async () => {
    const services = await source.listServices('en')
    expect(services.map((item) => item.slug)).toEqual(SERVICE_SLUGS)
    expect(services.map((item) => item.title)).toEqual([
      'AI Discovery',
      'AI Build',
      'AI Enablement',
    ])
  })

  it('gives each service full detail', async () => {
    for (const slug of SERVICE_SLUGS) {
      const detail = await source.getService(slug, 'en')
      expect(detail, slug).not.toBeNull()
      expect(detail!.problems.length).toBeGreaterThanOrEqual(3)
      expect(detail!.problems.length).toBeLessThanOrEqual(4)
      expect(detail!.deliverables.length).toBeGreaterThanOrEqual(3)
      expect(detail!.process).toHaveLength(4)
      expect(detail!.tools.length).toBeGreaterThanOrEqual(3)
      expect(detail!.ctaLabel).toBe('Plan my AI project')
      expect((await source.listFaq(`service:${slug}`, 'en')).length, slug).toBeGreaterThanOrEqual(2)
    }
  })

  it('keeps summaries a strict projection of the details', async () => {
    const services = await source.listServices('en')
    for (const summary of services) {
      const detail = await source.getService(summary.slug, 'en')
      expect(detail).toMatchObject(summary)
      expect(Object.keys(summary).sort()).toEqual(
        ['icon', 'locale', 'pose', 'slug', 'summary', 'title'].sort(),
      )
    }
  })

  it('returns null for an unknown slug', async () => {
    expect(await source.getService('web-development', 'en')).toBeNull()
  })

  it('uses tools as generic technology categories, never a brand claim', async () => {
    const brands =
      /openai|chatgpt|gpt|claude|gemini|anthropic|zapier|n8n|make\.com|google|microsoft/i
    for (const slug of SERVICE_SLUGS) {
      const detail = await source.getService(slug, 'en')
      for (const tool of detail!.tools) expect(tool, `${slug}: ${tool}`).not.toMatch(brands)
    }
  })
})

describe('static content source: product collections', () => {
  it('has the five capability categories as requests to Sino, one featured', async () => {
    const capabilities = await source.listCapabilities('en')
    expect(capabilities.map((item) => item.key)).toEqual([
      'customer-chat',
      'social-media',
      'sales-follow-up',
      'finance-admin',
      'operations',
    ])
    for (const item of capabilities) {
      expect(item.title.startsWith('Sino, ')).toBe(true)
      expect(item.mockupLines.length).toBeGreaterThan(0)
      expect(item.mockupLines.length).toBeLessThanOrEqual(FIELD_LIMITS.mockupLines)
    }
    expect(capabilities.filter((item) => item.featured)).toHaveLength(1)
    expect(new Set(capabilities.map((item) => item.tint)).size).toBeGreaterThan(1)
  })

  it('has 3 or 4 industries with unique keys', async () => {
    const industries = await source.listIndustries('en')
    expect(industries.length).toBeGreaterThanOrEqual(3)
    expect(industries.length).toBeLessThanOrEqual(FIELD_LIMITS.industries)
    expect(new Set(industries.map((item) => item.key)).size).toBe(industries.length)
  })
})

describe('static content source: FAQ', () => {
  it('has 5 to 7 home questions and answers for product and services', async () => {
    const home = await source.listFaq('home', 'en')
    expect(home.length).toBeGreaterThanOrEqual(5)
    expect(home.length).toBeLessThanOrEqual(7)
    expect((await source.listFaq('product', 'en')).length).toBeGreaterThanOrEqual(3)
    expect((await source.listFaq('services', 'en')).length).toBeGreaterThanOrEqual(3)
  })

  it('returns an empty list for a tag with no entries', async () => {
    expect(await source.listFaq('service:nope' as FaqTag, 'en')).toEqual([])
  })

  it('uses only declared tags', () => {
    const known = new Set<string>([
      'home',
      'product',
      'services',
      ...SERVICE_SLUGS.map((slug) => `service:${slug}`),
    ])
    for (const entry of staticContent.faq) {
      for (const tag of entry.tags) expect(known.has(tag), tag).toBe(true)
    }
  })
})

/** Plain text of a rich text document, for length checks. */
function textOf(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const { text, content } = node as { text?: string; content?: unknown[] }
  return [text ?? '', ...(content ?? []).map(textOf)].join(' ')
}

describe('static content source: blog', () => {
  it('has three launch articles, newest first, written by the Sineva team', async () => {
    const page = await source.listPosts({ locale: 'en', page: 1, pageSize: 10 })
    expect(page.total).toBe(3)
    const dates = page.posts.map((post) => post.publishedAt)
    expect([...dates].sort().reverse()).toEqual(dates)
    for (const post of page.posts) {
      expect(post.author).toEqual({ name: 'Sineva team', role: null, photo: null })
      expect(post.category).not.toBeNull()
      expect(post.cover?.kind).toBe('cover-kit')
    }
  })

  it('keeps summaries and details aligned and bodies at a readable length', async () => {
    const page = await source.listPosts({ locale: 'en', page: 1, pageSize: 10 })
    for (const summary of page.posts) {
      const detail = await source.getPost(summary.slug, 'en')
      expect(detail).toMatchObject(summary)
      const words = textOf(detail!.body).trim().split(/\s+/).length
      expect(words, summary.slug).toBeGreaterThanOrEqual(600)
      expect(words, summary.slug).toBeLessThanOrEqual(1000)
      expect(summary.readingMinutes).toBeGreaterThanOrEqual(2)
    }
  })

  it('lists categories used by the posts', async () => {
    const categories = await source.listCategories('en')
    const posts = await source.listPosts({ locale: 'en', page: 1, pageSize: 10 })
    const slugs = new Set(categories.map((item) => item.slug))
    for (const post of posts.posts) expect(slugs.has(post.category!.slug)).toBe(true)
  })

  it('filters by category and paginates', async () => {
    const [category] = await source.listCategories('en')
    const filtered = await source.listPosts({
      locale: 'en',
      category: category.slug,
      page: 1,
      pageSize: 10,
    })
    expect(filtered.posts.length).toBeGreaterThan(0)
    expect(filtered.posts.every((post) => post.category?.slug === category.slug)).toBe(true)
    const paged = await source.listPosts({ locale: 'en', page: 2, pageSize: 2 })
    expect(paged.posts).toHaveLength(1)
    expect(paged.total).toBe(3)
  })

  it('rejects invalid page and pageSize like the database source', async () => {
    await expect(source.listPosts({ locale: 'en', page: 0, pageSize: 5 })).rejects.toThrow(
      RangeError,
    )
    await expect(source.listPosts({ locale: 'en', page: 1, pageSize: 1.5 })).rejects.toThrow(
      RangeError,
    )
  })

  it('returns null for an unknown post', async () => {
    expect(await source.getPost('missing', 'en')).toBeNull()
  })
})

describe('static content source: work and team stay honestly empty', () => {
  it('returns an empty work list and no work detail', async () => {
    expect(await source.listWork({ locale: 'en' })).toEqual([])
    expect(await source.listWork({ locale: 'en', featured: true })).toEqual([])
    expect(await source.getWork('anything', 'en')).toBeNull()
  })

  it('returns no team members', async () => {
    expect(await source.listTeam('en')).toEqual([])
  })
})

describe('static content source: references', () => {
  it('uses only declared pose and icon keys', () => {
    const poses = new Set<string>(POSE_KEYS)
    const icons = new Set<string>(ICON_KEYS)
    const posed = [...walkObjectsWithKey(staticContent, 'pose')] as { pose: string }[]
    const iconed = [...walkObjectsWithKey(staticContent, 'icon')] as { icon: string }[]
    expect(posed.length).toBeGreaterThan(0)
    expect(iconed.length).toBeGreaterThan(0)
    for (const block of posed) expect(poses.has(block.pose), block.pose).toBe(true)
    for (const block of iconed) expect(icons.has(block.icon), block.icon).toBe(true)
  })

  it('references media only at the agreed asset paths with the agreed sizes', () => {
    const poseFiles = [
      'sino-wave',
      'sino-holding-phone',
      'sino-laptop',
      'sino-megaphone',
      'sino-coins',
      'sino-handshake',
      'sino-magnifier',
      'sino-blocks',
      'sino-whiteboard',
      'sino-thumbs-up',
      'sino-confused',
      'sino-relaxed',
    ]
    const allowed = new Map<string, [number, number]>([
      ['/mascot/poster/sino-hero.webp', [1600, 1600]],
      ['/og/default.png', [1200, 630]],
    ])
    for (const name of poseFiles) allowed.set(`/mascot/poses/${name}.webp`, [1200, 1200])

    const media = [...walkObjectsWithKey(staticContent, 'url')] as {
      url: string
      width: number
      height: number
      alt: string
    }[]
    expect(media.length).toBeGreaterThan(0)
    for (const item of media) {
      expect(allowed.has(item.url), item.url).toBe(true)
      expect([item.width, item.height], item.url).toEqual(allowed.get(item.url))
      expect(item.alt.length, item.url).toBeGreaterThan(0)
      // Alt text describes the action and never says "image of" (copywriting.md section 8).
      expect(item.alt).not.toMatch(/\b(image|picture|3d render|render) of\b/i)
    }
  })
})

describe('static content source: other locales', () => {
  it('returns the empty contract for a locale without content', async () => {
    const other = 'id' as unknown as 'en'
    expect(await source.getSiteSettings(other)).toBeNull()
    expect(await source.getPage('home', other)).toBeNull()
    expect(await source.listServices(other)).toEqual([])
    expect(await source.getService('ai-build', other)).toBeNull()
    expect(await source.listCapabilities(other)).toEqual([])
    expect(await source.listFaq('home', other)).toEqual([])
    expect((await source.listPosts({ locale: other, page: 1, pageSize: 5 })).total).toBe(0)
  })
})
