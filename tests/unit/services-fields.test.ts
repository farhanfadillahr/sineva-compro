import { describe, expect, it } from 'vitest'
import { parseFields } from '../../src/features/cms/fields'
import {
  serviceGlobalSchema,
  serviceLocaleSchema,
  serviceSlugField,
} from '../../src/features/services/fields'
import { launchServices } from '../../src/features/services/launch'

describe('service descriptors', () => {
  it('accepts the three launch services unchanged', () => {
    const rows = launchServices()
    expect(rows.map((r) => r.slug)).toEqual(['ai-discovery', 'ai-build', 'ai-enablement'])
    for (const row of rows) {
      expect(parseFields(serviceGlobalSchema, row.global)).toEqual({ ok: true, value: row.global })
      expect(parseFields(serviceLocaleSchema, row.local)).toEqual({ ok: true, value: row.local })
    }
  })

  it('rejects an em dash, an unknown icon, too few problems and a bad slug', () => {
    const [row] = launchServices()
    expect(parseFields(serviceLocaleSchema, { ...row.local, title: 'AI — Build' }).ok).toBe(false)
    expect(parseFields(serviceGlobalSchema, { ...row.global, icon: 'rocket' }).ok).toBe(false)
    const problems = row.local.problems as unknown[]
    expect(
      parseFields(serviceLocaleSchema, { ...row.local, problems: problems.slice(0, 2) }).ok,
    ).toBe(false)
    expect(parseFields(serviceSlugField, 'AI Build').ok).toBe(false)
  })
})
