import { expect, it } from 'vitest'
import id from '../../messages/id.json'
import en from '../../messages/en.json'
function entries(value: unknown, prefix = ''): [string, unknown][] {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value).flatMap(([key, entry]) =>
      entries(entry, prefix ? `${prefix}.${key}` : key),
    )
  }
  return [[prefix, value]]
}
it('keeps both dictionaries complete and nonempty without cross-locale fallback', () => {
  const idEntries = entries(id)
  const enEntries = entries(en)
  expect(enEntries.map(([key]) => key).sort()).toEqual(idEntries.map(([key]) => key).sort())
  for (const [key, value] of [...idEntries, ...enEntries]) {
    expect(typeof value, key).toBe('string')
    expect((value as string).trim().length, key).toBeGreaterThan(0)
  }
})
