// @vitest-environment jsdom
import React from 'react'
import { afterEach, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataTable } from '@/components/admin/data-table'
import { Pagination } from '@/components/admin/pagination'
afterEach(cleanup)
it('keeps server sort and page URLs, exposes sort state and selects only current page rows', async () => {
  const user = userEvent.setup()
  const navigation: string[] = []
  render(
    <DataTable
      label="Daftar artikel"
      rows={[
        { id: 'a', name: 'Artikel A' },
        { id: 'b', name: 'Artikel B' },
      ]}
      columns={[{ id: 'name', label: 'Judul', sortable: true, cell: (r) => r.name }]}
      total={80}
      pathname="/admin/blog"
      query="page=2&search=AI&sort=name&direction=asc"
      onNavigate={(url) => navigation.push(url)}
      selectable
      bulkActions={(ids) => <button>Terbitkan {ids.length}</button>}
    />,
  )
  expect(screen.getByRole('columnheader', { name: /Judul/ }).getAttribute('aria-sort')).toBe(
    'ascending',
  )
  await user.click(screen.getByRole('button', { name: /Urutkan Judul/ }))
  expect(navigation.pop()).toBe('/admin/blog?page=1&search=AI&sort=name&direction=desc')
  await user.click(screen.getByRole('checkbox', { name: 'Pilih semua baris di halaman ini' }))
  expect(screen.getByRole('button', { name: 'Terbitkan 2' })).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'Kolom' }))
  await user.click(screen.getByRole('checkbox', { name: 'Judul' }))
  expect(screen.queryByRole('columnheader', { name: /Judul/ })).toBeNull()
})
it('debounces search into URL and resets page while preserving filters', async () => {
  const user = userEvent.setup()
  const navigation: string[] = []
  render(
    <DataTable
      label="Artikel"
      rows={[]}
      columns={[]}
      total={0}
      pathname="/admin/blog"
      query="status=draft&page=5"
      onNavigate={(url) => navigation.push(url)}
    />,
  )
  await user.type(screen.getByRole('searchbox', { name: 'Cari Artikel' }), 'AI')
  await new Promise((resolve) => setTimeout(resolve, 350))
  expect(navigation).toEqual(['/admin/blog?status=draft&page=1&search=AI'])
})
it('reports loading, empty and error with a working retry', async () => {
  const user = userEvent.setup()
  let retried = false
  const { rerender } = render(
    <DataTable
      label="Artikel"
      rows={[]}
      columns={[]}
      total={0}
      pathname="/admin/blog"
      query=""
      loading
    />,
  )
  expect(screen.getByRole('status').textContent).toContain('Memuat')
  rerender(
    <DataTable
      label="Artikel"
      rows={[]}
      columns={[]}
      total={0}
      pathname="/admin/blog"
      query=""
      error="Gagal memuat"
      onRetry={() => {
        retried = true
      }}
    />,
  )
  await user.click(screen.getByRole('button', { name: 'Coba lagi' }))
  expect(retried).toBe(true)
  rerender(
    <DataTable label="Artikel" rows={[]} columns={[]} total={0} pathname="/admin/blog" query="" />,
  )
  expect(screen.getByText('Belum ada data.')).toBeTruthy()
})
it('links first, last and nearby pages, shows result range, and changes size via URL', async () => {
  const user = userEvent.setup()
  let url = ''
  render(
    <Pagination
      total={234}
      page={5}
      pageSize={20}
      pathname="/admin/blog"
      query="search=AI&page=5"
      onNavigate={(v) => {
        url = v
      }}
    />,
  )
  expect(screen.getByText('Menampilkan 81-100 dari 234')).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Halaman 5' }).getAttribute('aria-current')).toBe('page')
  expect(screen.getByRole('link', { name: 'Halaman terakhir' }).getAttribute('href')).toBe(
    '/admin/blog?search=AI&page=12',
  )
  await user.selectOptions(screen.getByLabelText('Baris per halaman'), '50')
  expect(url).toBe('/admin/blog?search=AI&page=1&pageSize=50')
})
