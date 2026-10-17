// @vitest-environment jsdom
import React from 'react'
import { afterEach, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { SeoPreview, SeoPreviewProvider } from '@/components/admin/cms/seo-preview'

afterEach(cleanup)

const preview = (titleTemplate: string, metaTitle: string) =>
  render(
    <SeoPreviewProvider value={{ titleTemplate, origin: 'https://sineva.id', siteName: 'Sineva' }}>
      <SeoPreview value={{ metaTitle, metaDescription: 'Deskripsi.' }} />
    </SeoPreviewProvider>,
  )

// CPR-104: the brand comes from the Admin's title template, so the preview applies it even when
// the topic mentions the brand, and the length warning follows whatever template is active.
it('applies the Admin title template to the topic, like the site', () => {
  preview('{title} | Sineva', 'See how Sineva makes AI simple')
  expect(screen.getAllByText('See how Sineva makes AI simple | Sineva').length).toBeGreaterThan(0)
  expect(screen.queryByRole('status')).toBeNull()
})

it('warns when the templated title runs past 60 characters', () => {
  const topic = 'A topic that fits on its own but not with the brand added'
  preview('{title} | Sineva', topic)
  expect(screen.getByRole('status').textContent).toContain(`${topic.length + 9} karakter`)
})

it('recomputes the budget when the Admin changes the template', () => {
  const topic = 'Fifty one characters of topic text for this check!'
  preview('{title}', topic)
  expect(screen.queryByRole('status')).toBeNull()
  cleanup()
  preview('{title} | Sineva Product Suite', topic)
  expect(screen.getByRole('status')).toBeTruthy()
})
