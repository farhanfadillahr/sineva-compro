import { expect, it } from 'vitest'
import { resolveTranslatedHref, type TranslationReference } from '../../src/i18n/content-links'
const input = { kind: 'post', entityId: 'entity-1', targetLocale: 'en' } as const
const references: readonly TranslationReference[] = [
  { kind: 'post', entityId: 'entity-1', locale: 'id', slug: 'panduan-ai', published: true },
  { kind: 'post', entityId: 'entity-1', locale: 'en', slug: 'ai-guide', published: true },
]
it('resolves a translated slug by entity, kind and target locale', () => {
  expect(resolveTranslatedHref(input, references)).toEqual({
    status: 'detail',
    href: '/en/blog/ai-guide',
  })
  expect(resolveTranslatedHref({ ...input, targetLocale: 'id' }, references)).toEqual({
    status: 'detail',
    href: '/id/blog/panduan-ai',
  })
})
it.each(['service', 'portfolio'] as const)('resolves a published %s translation', (kind) => {
  expect(
    resolveTranslatedHref({ ...input, kind }, [{ ...references[1], kind, slug: 'ai-case' }]),
  ).toEqual({
    status: 'detail',
    href: kind === 'service' ? '/en/services/ai-case' : '/en/portfolio/ai-case',
  })
})
it.each([true, false])('falls back to target blog list when target missing/draft=%s', (missing) => {
  const rows = missing ? [references[0]] : [references[0], { ...references[1], published: false }]
  expect(resolveTranslatedHref(input, rows)).toEqual({ status: 'list', href: '/en/blog' })
})
it('falls back to the ID blog list without guessing the English slug', () => {
  expect(resolveTranslatedHref({ ...input, targetLocale: 'id' }, [references[1]])).toEqual({
    status: 'list',
    href: '/id/blog',
  })
})
it.each(['service', 'portfolio'] as const)(
  'does not fabricate a %s target with no published translation',
  (kind) => {
    expect(
      resolveTranslatedHref({ ...input, kind }, [{ ...references[1], kind, published: false }]),
    ).toEqual({ status: 'unavailable' })
  },
)
it('does not mix entity IDs, kinds or locales', () => {
  expect(
    resolveTranslatedHref(input, [
      { ...references[1], entityId: 'another-entity' },
      { ...references[1], kind: 'portfolio' },
      references[0],
    ]),
  ).toEqual({ status: 'list', href: '/en/blog' })
})
it('rejects conflicting target translations instead of selecting the first', () => {
  expect(
    resolveTranslatedHref(input, [references[1], { ...references[1], slug: 'other-guide' }]),
  ).toEqual({ status: 'unavailable' })
})
it.each([
  '',
  '.',
  '..',
  '../secret',
  'a/b',
  'a\\b',
  'https://evil.example/a',
  '%2e%2e',
  'a%2fb',
  'UPPER',
  'space slug',
  '-slug',
  'slug-',
])('rejects unsafe/invalid target slug %s', (slug) => {
  expect(resolveTranslatedHref(input, [{ ...references[1], slug }])).toEqual({
    status: 'unavailable',
  })
})
