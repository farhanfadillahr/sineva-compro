import { readdirSync, readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import en from '../../messages/en.json'

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
it('ships only the English bundle; the Indonesian text lives in docs as source', () => {
  expect(readdirSync(new URL('../../messages', import.meta.url))).toEqual(['en.json'])
  const id = JSON.parse(
    readFileSync(new URL('../../docs/content/messages-id.json', import.meta.url), 'utf8'),
  )
  expect(entries(id).length).toBeGreaterThan(0)
  for (const [key, value] of entries(id)) expect(typeof value, key).toBe('string')
})
