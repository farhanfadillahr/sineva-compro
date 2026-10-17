// @vitest-environment jsdom
import React from 'react'
import { afterEach, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { PreviewBar } from '@/components/admin/preview-bar'

afterEach(cleanup)

// CPR-106: a preview looked exactly like the live site.
it('labels the preview and ends it with a POST to the exit route', () => {
  const { container } = render(<PreviewBar />)
  expect(screen.getByRole('status').textContent).toContain('Mode pratinjau.')
  const form = container.querySelector('form')!
  expect(form.getAttribute('method')).toBe('post')
  expect(form.getAttribute('action')).toBe('/admin/preview/exit')
  expect(screen.getByRole('button', { name: 'Keluar dari pratinjau' })).toBeTruthy()
})
