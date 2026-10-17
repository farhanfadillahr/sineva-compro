// @vitest-environment jsdom
import React from 'react'
import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdminShell, PageHeader, FormLayout, breadcrumbLabel } from '@/components/admin/shell'
vi.mock('next/navigation', () => ({ usePathname: () => '/admin/users' }))
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
})
afterEach(cleanup)
it('renders current breadcrumb, public link, skip link and authenticated account slot', async () => {
  const user = userEvent.setup()
  render(
    <AdminShell
      principal={{ id: '1', name: 'Farhan', role: 'admin' }}
      logout={<button>Keluar</button>}
    >
      <main id="admin-main">
        <PageHeader title="Pengguna" description="Akses tim" actions={<button>Simpan</button>} />
        <FormLayout side={<p>Status publikasi</p>}>
          <p>Isi</p>
        </FormLayout>
      </main>
    </AdminShell>,
  )
  expect(screen.getByRole('navigation', { name: 'Breadcrumb' }).textContent).toContain('Pengguna')
  expect(screen.getByRole('link', { name: /Lihat situs/ }).getAttribute('target')).toBe('_blank')
  expect(screen.getByRole('link', { name: 'Lewati navigasi' }).getAttribute('href')).toBe(
    '#admin-main',
  )
  await user.click(screen.getByRole('button', { name: 'Menu akun' }))
  expect(screen.getByRole('button', { name: 'Keluar' })).toBeTruthy()
  await user.keyboard('{Escape}')
  await user.click(screen.getByRole('button', { name: 'Buka navigasi' }))
  expect(screen.getByRole('dialog', { name: 'Navigasi admin' })).toBeTruthy()
})

// Every "new" page used to read "Tambah Editor", including new articles, FAQ and team members.
it('labels a "new" page after what it adds', () => {
  expect(breadcrumbLabel(['admin', 'users', 'new'], 2)).toBe('Tambah Editor')
  expect(breadcrumbLabel(['admin', 'blog', 'new'], 2)).toBe('Tambah baru')
  expect(breadcrumbLabel(['admin', 'faq', 'new'], 2)).toBe('Tambah baru')
  expect(breadcrumbLabel(['admin', 'blog', 'abc'], 2)).toBe('Detail')
})
