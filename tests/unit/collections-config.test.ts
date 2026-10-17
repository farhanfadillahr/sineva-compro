import { describe, expect, it } from 'vitest'
import { parseFields } from '../../src/features/cms/fields'
import { collectionConfigs, type CollectionName } from '../../src/features/collections/configs'
import { collectionSeedData } from '../../src/features/collections/seed-data'

const names = Object.keys(collectionConfigs) as CollectionName[]

describe('ordered collections', () => {
  it.each(names)('%s: launch and demo rows pass their descriptors', (name) => {
    const config = collectionConfigs[name]
    for (const row of [...collectionSeedData[name].launch(), ...collectionSeedData[name].demo]) {
      expect(parseFields(config.globalSchema, row.global)).toEqual({ ok: true, value: row.global })
      expect(parseFields(config.localeSchema, row.local)).toEqual({ ok: true, value: row.local })
      for (const local of Object.values(row.translations ?? {}))
        expect(parseFields(config.localeSchema, local)).toEqual({ ok: true, value: local })
    }
  })

  it.each(names)('%s: demo rows are clearly marked', (name) => {
    for (const row of collectionSeedData[name].demo) expect(row.key.startsWith('demo-')).toBe(true)
  })
})

describe('capabilities', () => {
  const config = collectionConfigs.capabilities
  const local = collectionSeedData.capabilities.launch()[0].local as Record<string, unknown>
  const global = collectionSeedData.capabilities.launch()[0].global as Record<string, unknown>

  it('limits mockup lines to 4 and checks them with the copy rule', () => {
    expect(
      parseFields(config.localeSchema, { ...local, mockupLines: ['a', 'b', 'c', 'd', 'e'] }).ok,
    ).toBe(false)
    expect(parseFields(config.localeSchema, { ...local, mockupLines: ['a — b'] }).ok).toBe(false)
  })

  it('accepts tint and pose only from the code-defined lists', () => {
    expect(parseFields(config.globalSchema, { ...global, tint: 'purple' }).ok).toBe(false)
    expect(parseFields(config.globalSchema, { ...global, pose: 'flying' }).ok).toBe(false)
  })
})
