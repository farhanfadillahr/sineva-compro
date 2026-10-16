import { describe, expect, it } from 'vitest'
import { getContentSource } from '../../src/lib/content-source'

describe('getContentSource', () => {
  it('serves the public content contract', async () => {
    const source = getContentSource()
    const settings = await source.getSiteSettings('en')
    expect(settings?.brand.siteName).toBe('Sineva')
    const services = await source.listServices('en')
    expect(services.map((service) => service.slug)).toEqual([
      'ai-discovery',
      'ai-build',
      'ai-enablement',
    ])
  })
})
