import { describe, expect, it } from 'vitest'
import { mediaUsageChanges } from '@/features/media/usage-changes'

// Media usage rows store the owner as `entity` plus an `entity_id` whose prefix names the
// collection or page. Saving alt text or replacing a file must refresh every page that shows it.
describe('mediaUsageChanges', () => {
  it('maps page usage to that page, whatever the locale', () => {
    expect(
      mediaUsageChanges([
        { entity: 'pages', entityId: 'thankYou:en' },
        { entity: 'pages', entityId: 'thankYou:id' },
      ]),
    ).toEqual([{ entity: 'page', key: 'thankYou' }])
  })

  it('maps FAQ usage (stored under pages) to the FAQ library, not a page', () => {
    expect(
      mediaUsageChanges([
        { entity: 'pages', entityId: 'faq:7f0e2a4e-1111-4c4c-9999-000000000001' },
      ]),
    ).toEqual([{ entity: 'faq' }])
  })

  it('maps documents, collections and settings to their list tags', () => {
    expect(
      mediaUsageChanges([
        { entity: 'services', entityId: 'services:abc' },
        { entity: 'posts', entityId: 'posts:abc:en' },
        { entity: 'posts', entityId: 'categories:abc' },
        { entity: 'portfolio', entityId: 'work:abc:id' },
        { entity: 'team', entityId: 'team:abc' },
        { entity: 'product', entityId: 'capabilities:abc' },
        { entity: 'product', entityId: 'businessTypes:abc' },
        { entity: 'settings', entityId: 'site' },
      ]),
    ).toEqual([
      { entity: 'service', slugs: [] },
      { entity: 'post', slugs: [] },
      { entity: 'categories' },
      { entity: 'work', slugs: [] },
      { entity: 'team' },
      { entity: 'capabilities' },
      { entity: 'industries' },
      { entity: 'settings' },
    ])
  })

  it('ignores unknown owners instead of guessing', () => {
    expect(
      mediaUsageChanges([
        { entity: 'pages', entityId: 'unknownPage:en' },
        { entity: 'product', entityId: 'other:abc' },
        { entity: 'email', entityId: 'x' },
      ]),
    ).toEqual([])
  })
})
