// @vitest-environment jsdom
import { createElement } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { AuditView } from '../../src/features/audit/components/audit-view'

afterEach(cleanup)
const result = {
  actor: 'staff-id',
  entity: 'users' as const,
  page: 2,
  pageSize: 20,
  total: 42,
  entries: [
    {
      id: 'log-id',
      actorId: 'staff-id',
      actorName: 'Nama staf',
      entity: 'users',
      entityId: 'internal-id',
      action: 'password_change',
      changedFields: ['password'],
      createdAt: new Date('2026-10-16T00:00:00Z'),
    },
  ],
}
it('renders a read-only audit table, labeled filters and pagination preserving filters', () => {
  render(createElement(AuditView, { result }))
  expect(screen.getByRole('table', { name: 'Riwayat perubahan admin' })).toBeTruthy()
  expect(screen.getByText('Nama staf')).toBeTruthy()
  expect(screen.getByText('Ganti kata sandi')).toBeTruthy()
  expect(screen.getByText('password')).toBeTruthy()
  expect(screen.getByLabelText('ID pelaku').getAttribute('name')).toBe('actor')
  expect(screen.getByLabelText('Entitas').getAttribute('name')).toBe('entity')
  expect(screen.getByRole('link', { name: 'Halaman berikutnya' }).getAttribute('href')).toBe(
    '/admin/audit?actor=staff-id&entity=users&page=3&pageSize=20',
  )
  expect(screen.getByRole('link', { name: 'Halaman sebelumnya' }).getAttribute('href')).toBe(
    '/admin/audit?actor=staff-id&entity=users&page=1&pageSize=20',
  )
  expect(screen.queryByRole('button', { name: /hapus|ubah|ekspor/i })).toBeNull()
  expect(screen.getByText('Menampilkan 21-40 dari 42')).toBeTruthy()
})
it('shows an empty state and no pagination links when no entries match', () => {
  render(createElement(AuditView, { result: { ...result, page: 1, total: 0, entries: [] } }))
  expect(screen.getByText('Belum ada aktivitas yang cocok dengan filter.')).toBeTruthy()
  expect(screen.queryByRole('link', { name: 'Halaman berikutnya' })).toBeNull()
  expect(screen.queryByRole('link', { name: 'Halaman sebelumnya' })).toBeNull()
  expect(screen.getByText('Menampilkan 0-0 dari 0')).toBeTruthy()
})
it('keeps history readable after the actor account is deleted', () => {
  render(
    createElement(AuditView, {
      result: { ...result, entries: [{ ...result.entries[0], actorName: null, actorId: null }] },
    }),
  )
  expect(screen.getByText('Akun telah dihapus')).toBeTruthy()
})
