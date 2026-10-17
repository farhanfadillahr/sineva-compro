import { describe, expect, it } from 'vitest'
import { PAGE_KEYS } from '../../src/features/content/types'
import { staticContent } from '../../src/content/static/source'
import { parseFields } from '../../src/features/cms/fields'
import { pageSchemas, PAGE_ROUTES } from '../../src/features/pages/fields'
import { launchPage } from '../../src/features/pages/launch'
import { FutureVersionError, migrateDocument } from '../../src/features/pages/migrations'
import { withTopicTitle } from '../../src/features/cms/seo-title'

describe('page descriptors', () => {
  const cases = PAGE_KEYS.flatMap((key) =>
    (['en', 'id'] as const).map((locale) => [key, locale] as const),
  )
  it.each(cases)('%s (%s): the launch content passes its descriptor unchanged', (key, locale) => {
    const stored = launchPage(key, locale)!
    const result = parseFields(pageSchemas[key], stored)
    expect(result).toEqual({ ok: true, value: stored })
  })

  it('keeps every DTO field (launch content without media round-trips to the static page)', () => {
    const { key, locale, ...dto } = staticContent.pages.contact
    void key
    void locale
    // The meta title is stored as the topic only; the site adds the brand (CPR-104).
    expect(launchPage('contact', 'en')).toEqual({ ...dto, seo: withTopicTitle(dto.seo) })
  })

  it('has an admin route for every page', () => {
    expect(PAGE_ROUTES.map((r) => r.key).sort()).toEqual([...PAGE_KEYS].sort())
  })

  it('rejects a missing required field and over-limit text', () => {
    const home = launchPage('home', 'en')!
    const hero = home.hero as Record<string, unknown>
    const missing = parseFields(pageSchemas.home, { ...home, hero: { ...hero, headline: '' } })
    expect(missing.ok).toBe(false)
    if (!missing.ok) expect(missing.errors['hero.headline']).toBeDefined()
    const long = parseFields(pageSchemas.home, {
      ...home,
      hero: { ...hero, primaryCtaLabel: 'One two three four five' },
    })
    expect(long.ok).toBe(false)
  })

  it('rejects an em dash', () => {
    const notFound = launchPage('notFound', 'en')!
    expect(parseFields(pageSchemas.notFound, { ...notFound, body: 'Back — now' }).ok).toBe(false)
  })

  it('accepts only code-defined poses and icons', () => {
    const home = launchPage('home', 'en')!
    const paths = home.twoPaths as { product: Record<string, unknown> }
    const result = parseFields(pageSchemas.home, {
      ...home,
      twoPaths: { ...paths, product: { ...paths.product, pose: 'dancing' } },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors['twoPaths.product.pose']).toBeDefined()
  })

  it('keeps a hidden optional section hidden', () => {
    const home = launchPage('home', 'en')!
    const result = parseFields<Record<string, { visible: boolean }>>(pageSchemas.home, {
      ...home,
      fromBlog: { visible: false, title: 'From the blog' },
    })
    expect(result.ok && result.value.fromBlog.visible).toBe(false)
  })

  it('validates rich text against the allowed node list', () => {
    const privacy = launchPage('privacy', 'en')!
    expect(
      parseFields(pageSchemas.privacy, {
        ...privacy,
        body: { type: 'doc', content: [{ type: 'script', text: 'x' }] },
      }).ok,
    ).toBe(false)
  })
})

describe('migrateDocument', () => {
  const migrations = [
    (doc: Record<string, unknown>) => ({
      ...doc,
      comparison: { ...(doc.comparison as object), visible: true },
    }),
    (doc: Record<string, unknown>) => {
      const { tagline, ...rest } = doc
      return { ...rest, lead: tagline }
    },
  ]
  it('migrates a version 1 document to the current version', () => {
    expect(migrateDocument({ comparison: { title: 'X' }, tagline: 'Hi' }, 1, migrations)).toEqual({
      comparison: { title: 'X', visible: true },
      lead: 'Hi',
    })
  })
  it('migrates a version 2 document with only the remaining step', () => {
    expect(migrateDocument({ tagline: 'Hi' }, 2, migrations)).toEqual({ lead: 'Hi' })
  })
  it('returns a current document unchanged and refuses a future one', () => {
    expect(migrateDocument({ a: 1 }, 3, migrations)).toEqual({ a: 1 })
    expect(() => migrateDocument({}, 4, migrations)).toThrow(FutureVersionError)
  })
})
