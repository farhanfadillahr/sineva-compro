import { readdirSync } from 'node:fs'
import { expect, it } from 'vitest'
import en from '../../messages/en.json'
import id from '../../messages/id.json'

function entries(value: unknown, prefix = ''): [string, unknown][] {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value).flatMap(([key, entry]) =>
      entries(entry, prefix ? `${prefix}.${key}` : key),
    )
  }
  return [[prefix, value]]
}
it('keeps the English dictionary complete: every value a nonempty string', () => {
  const all = entries(en)
  expect(all.length).toBeGreaterThan(0)
  for (const [key, value] of all) {
    expect(typeof value, key).toBe('string')
    expect((value as string).trim().length, key).toBeGreaterThan(0)
  }
})
it('uses no em dash or en dash in public copy', () => {
  for (const [key, value] of entries(en)) expect(value as string, key).not.toMatch(/[–—]/)
})
it('titles every page of the English sitemap', () => {
  expect(en.Pages).toEqual({
    home: 'Home',
    aiAgents: 'AI Agents',
    services: 'Services',
    work: 'Work',
    blog: 'Blog',
    about: 'About',
    contact: 'Contact',
    thankYou: 'Thank you',
    privacy: 'Privacy Policy',
  })
})
it('ships one bundle per locale (CPR-101)', () => {
  expect(readdirSync(new URL('../../messages', import.meta.url)).sort()).toEqual([
    'en.json',
    'id.json',
  ])
})
it('keeps the Indonesian dictionary in step with the English one', () => {
  // Same keys, so no Indonesian page falls back to a raw key; every value a nonempty string.
  expect(entries(id).map(([key]) => key)).toEqual(entries(en).map(([key]) => key))
  for (const [key, value] of entries(id)) {
    expect(typeof value, key).toBe('string')
    expect((value as string).trim().length, key).toBeGreaterThan(0)
    expect(value as string, key).not.toMatch(/[–—]/)
  }
})
it('keeps the same ICU placeholders in both languages', () => {
  const placeholders = (value: unknown) =>
    [...String(value).matchAll(/\{(\w+)/g)].map((match) => match[1]).sort()
  const idByKey = new Map(entries(id))
  for (const [key, value] of entries(en))
    expect(placeholders(idByKey.get(key)), key).toEqual(placeholders(value))
})
