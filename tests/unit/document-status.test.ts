import { expect, it } from 'vitest'
import { documentStatus } from '../../src/features/documents/status'
import type { DocumentItem } from '../../src/features/documents/configs'

const published = {
  draft: { title: 'Artikel', summary: 'Ringkasan' },
  published: { summary: 'Ringkasan', title: 'Artikel' },
  draftSlug: 'artikel',
  publishedSlug: 'artikel',
  draftUpdatedAt: '2026-10-17T00:00:00.000Z',
  firstPublishedAt: '2026-10-17T00:00:00.000Z',
  lastPublishedAt: '2026-10-17T00:00:00.000Z',
} satisfies NonNullable<DocumentItem['locales'][string]>

it('can derive list status outside the client editor, including a missing translation', () => {
  expect(documentStatus(undefined)).toEqual({ label: 'Belum ada', tone: 'warning' })
  expect(documentStatus({ ...published, published: null })).toEqual({
    label: 'Draf',
    tone: 'warning',
  })
})

it('ignores object key order but detects unpublished content and slug changes', () => {
  expect(documentStatus(published)).toEqual({ label: 'Terbit', tone: 'success' })
  for (const changes of [{ draft: { title: 'Draf baru' } }, { draftSlug: 'alamat-baru' }])
    expect(documentStatus({ ...published, ...changes })).toEqual({
      label: 'Terbit, ada draf baru',
      tone: 'brand',
    })
})
