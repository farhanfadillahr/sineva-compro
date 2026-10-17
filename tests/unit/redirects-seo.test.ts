import { describe, expect, it } from 'vitest'
import { chainProblem, isReservedPath, normalizePath } from '../../src/features/redirects/paths'
import { parseFields } from '../../src/features/cms/fields'
import { seoSchema } from '../../src/features/cms/seo-fields'

describe('redirect paths', () => {
  it('normalises public paths and refuses hosts, queries and the admin', () => {
    expect(normalizePath('/blog/old/')).toBe('/blog/old')
    expect(normalizePath('//evil.example/x')).toBeNull()
    expect(normalizePath('https://evil.example')).toBeNull()
    expect(normalizePath('/blog?x=1')).toBeNull()
    expect(isReservedPath('/admin/users')).toBe(true)
    expect(isReservedPath('/API/auth')).toBe(true)
    expect(isReservedPath('/administrator')).toBe(false)
  })

  it('rejects loops and chains over the limit', () => {
    const rule = (fromPath: string, toPath: string) => ({ fromPath, toPath, status: 301 })
    expect(chainProblem(rule('/a', '/b'), [rule('/b', '/a')])).toMatch(/putaran/)
    expect(chainProblem(rule('/a', '/b'), [rule('/b', '/c')])).toBeNull()
    const chain = [
      rule('/b', '/c'),
      rule('/c', '/d'),
      rule('/d', '/e'),
      rule('/e', '/f'),
      rule('/f', '/g'),
    ]
    expect(chainProblem(rule('/a', '/b'), chain)).toMatch(/Rantai/)
  })
})

describe('per-document SEO', () => {
  const stored = {
    metaTitle: 'Blog | Sineva',
    metaDescription: 'Notes.',
    ogImage: null,
    canonicalUrl: null,
    noindex: false,
  }
  it('enforces the title and description limits', () => {
    expect(parseFields(seoSchema, { ...stored, metaTitle: 'x'.repeat(61) }).ok).toBe(false)
    expect(parseFields(seoSchema, { ...stored, metaDescription: 'x'.repeat(161) }).ok).toBe(false)
  })
  it('keeps canonical and noindex for an Editor, lets an Admin change them', () => {
    const attempt = {
      ...stored,
      metaTitle: 'New | Sineva',
      canonicalUrl: 'https://x.example/a',
      noindex: true,
    }
    expect(parseFields(seoSchema, attempt, { isAdmin: false, previous: stored })).toEqual({
      ok: true,
      value: { ...stored, metaTitle: 'New | Sineva' },
    })
    expect(parseFields(seoSchema, attempt, { isAdmin: true, previous: stored })).toEqual({
      ok: true,
      value: attempt,
    })
  })
})
