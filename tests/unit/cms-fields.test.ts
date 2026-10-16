import { describe, expect, it } from 'vitest'
import {
  changedKeys,
  collectMedia,
  f,
  parseE164,
  parseFields,
  parseMediaValue,
} from '../../src/features/cms/fields'
import { parseRichText } from '../../src/features/cms/rich-text'

describe('parseE164', () => {
  it('accepts a valid international number and strips separators', () => {
    expect(parseE164('+6285199368510')).toBe('+6285199368510')
    expect(parseE164('+62 851-9936 8510')).toBe('+6285199368510')
  })
  it.each([
    ['missing plus', '6285199368510'],
    ['letters', '+62851abc68510'],
    ['too short', '+6281234'],
    ['too long', '+6285199368510123'],
    ['leading zero country code', '+0285199368510'],
  ])('rejects %s', (_, input) => {
    expect(parseE164(input)).toBeNull()
  })
})

describe('parseFields', () => {
  const schema = f.object({
    title: f.required('Judul', 10),
    note: f.optional('Catatan', 20),
    phone: f.required('Telepon', 16, { format: 'e164', publicCopy: false }),
    tags: f.list('Tag', f.required('Tag', 10), 2),
    secret: f.object({ token: f.text('Token', 10, { publicCopy: false }) }, { adminOnly: true }),
  })
  const valid = {
    title: 'Hello',
    note: '',
    phone: '+6285199368510',
    tags: ['a'],
    secret: { token: 'x' },
  }

  it('returns a clean value, empty optional text as null and drops unknown keys', () => {
    const result = parseFields(schema, { ...valid, extra: 1 })
    expect(result).toEqual({ ok: true, value: { ...valid, note: null } })
  })

  it('reports errors by path', () => {
    const result = parseFields(schema, {
      ...valid,
      title: 'Way too long title',
      phone: '0851',
      tags: ['a', 'b', 'c'],
    })
    expect(result.ok).toBe(false)
    if (!result.ok)
      expect(Object.keys(result.errors).sort()).toEqual(['phone', 'tags', 'title'].sort())
  })

  it('rejects an em dash or en dash in public copy', () => {
    const result = parseFields(schema, { ...valid, title: 'Hi — yo' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.title).toMatch(/em dash/)
    expect(parseFields(schema, { ...valid, note: 'a – b' }).ok).toBe(false)
  })

  it('keeps Admin-only groups from the stored value for a non-Admin', () => {
    const previous = { ...valid, secret: { token: 'stored' } }
    const result = parseFields(
      schema,
      { ...valid, secret: { token: 'hacked' } },
      { isAdmin: false, previous },
    )
    expect(result).toMatchObject({ ok: true, value: { secret: { token: 'stored' } } })
    const admin = parseFields(
      schema,
      { ...valid, secret: { token: 'changed' } },
      {
        isAdmin: true,
        previous,
      },
    )
    expect(admin).toMatchObject({ ok: true, value: { secret: { token: 'changed' } } })
  })
})

describe('media values', () => {
  it('accepts a library reference or a public file, and nothing else', () => {
    const id = '0f8fad5b-d9cb-469f-a165-70867728950e'
    expect(parseMediaValue({ kind: 'media', id })).toEqual({ kind: 'media', id })
    expect(
      parseMediaValue({ kind: 'static', url: '/og/a.png', width: 10, height: 10, alt: 'A' }),
    ).toMatchObject({ kind: 'static' })
    expect(
      parseMediaValue({ kind: 'static', url: '//evil.test/a.png', width: 1, height: 1, alt: 'a' }),
    ).toBeUndefined()
    expect(parseMediaValue({ kind: 'media', id: 'not-a-uuid' })).toBeUndefined()
    expect(parseMediaValue(null)).toBeNull()
  })

  it('collects library references with stable paths', () => {
    const id = '0f8fad5b-d9cb-469f-a165-70867728950e'
    const schema = f.object({
      hero: f.object({ poster: f.media('Poster') }),
      gallery: f.list('G', f.media('G'), 3),
    })
    expect(
      collectMedia(schema, {
        hero: { poster: { kind: 'media', id } },
        gallery: [null, { kind: 'media', id }],
      }),
    ).toEqual([
      { field: 'hero.poster', mediaId: id },
      { field: 'gallery.1', mediaId: id },
    ])
  })
})

describe('changedKeys', () => {
  it('lists top-level keys that changed', () => {
    expect(changedKeys({ a: 1, b: { c: 1 } }, { a: 1, b: { c: 2 }, d: 3 })).toEqual(['b', 'd'])
  })
})

describe('parseRichText', () => {
  it('accepts the allowed nodes and drops empty documents to an empty list', () => {
    expect(parseRichText({ type: 'doc', content: [{ type: 'paragraph' }] })).toEqual({
      ok: true,
      value: { type: 'doc', content: [] },
    })
    const doc = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Hi' }] },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Link', marks: [{ type: 'link', attrs: { href: '/contact' } }] },
          ],
        },
      ],
    }
    expect(parseRichText(doc).ok).toBe(true)
  })
  it.each([
    ['unknown node', { type: 'doc', content: [{ type: 'iframe' }] }],
    [
      'javascript link',
      {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'x',
                marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
              },
            ],
          },
        ],
      },
    ],
    [
      'em dash',
      { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a — b' }] }] },
    ],
    [
      'heading level 1',
      {
        type: 'doc',
        content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'x' }] }],
      },
    ],
  ])('rejects %s', (_, input) => {
    expect(parseRichText(input).ok).toBe(false)
  })
})
