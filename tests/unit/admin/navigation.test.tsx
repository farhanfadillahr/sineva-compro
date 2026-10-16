// @vitest-environment jsdom
import React from 'react'
import { afterEach, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sidebar } from '@/components/admin/sidebar'
afterEach(() => { cleanup(); localStorage.clear() })
it('excludes privileged groups for Editor and reveals Admin routes only for Admin', () => {
  const { unmount } = render(<Sidebar role="editor" pathname="/admin" />)
  expect(screen.queryByText('Pengguna')).toBeNull()
  expect(screen.queryByText('Prospek')).toBeNull()
  expect(screen.queryByText('Pengaturan')).toBeNull()
  expect(screen.getByRole('tree', { name: 'Navigasi admin' })).toBeTruthy()
  unmount()
  render(<Sidebar role="admin" pathname="/admin/users" />)
  expect(screen.getByRole('treeitem', { name: 'Pengguna' }).getAttribute('aria-current')).toBe('page')
})
it('roves focus, expands, collapses, visits children and persists expanded branches', async () => {
  const user = userEvent.setup()
  render(<Sidebar role="editor" pathname="/admin" />)
  const dashboard = screen.getByRole('treeitem', { name: 'Dasbor' })
  dashboard.focus()
  await user.keyboard('{ArrowDown}')
  const pages = screen.getByRole('treeitem', { name: 'Halaman' })
  expect(document.activeElement).toBe(pages)
  await user.keyboard('{ArrowRight}')
  expect(pages.getAttribute('aria-expanded')).toBe('true')
  await user.keyboard('{ArrowRight}')
  expect(document.activeElement?.textContent).toContain('Beranda')
  await user.keyboard('{ArrowLeft}')
  expect(document.activeElement).toBe(pages)
  await user.keyboard('{ArrowLeft}')
  expect(pages.getAttribute('aria-expanded')).toBe('false')
  expect(localStorage.getItem('sineva.admin.navigation.v1')).toBeTruthy()
  await user.keyboard('{End}')
  expect(document.activeElement?.textContent).toContain('Media')
})
it('retains the active trail and tolerates unavailable or malformed storage', () => {
  localStorage.setItem('sineva.admin.navigation.v1', 'bad-json')
  render(<Sidebar role="editor" pathname="/admin/blog/categories" />)
  expect(screen.getByRole('treeitem', { name: 'Kategori' }).getAttribute('aria-current')).toBe('page')
  expect(screen.getByRole('treeitem', { name: 'Blog' }).getAttribute('aria-expanded')).toBe('true')
})
