import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LeadsBarChart, StatusDonut } from '../../src/features/dashboard/components/charts'

describe('dashboard charts', () => {
  it('shows an empty state instead of a flat chart', () => {
    render(<LeadsBarChart title="Lead per layanan" data={[]} />)
    expect(screen.getByText('Belum ada data untuk periode ini.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Lihat sebagai tabel' })).toBeNull()
  })
  it('summarises for screen readers and toggles a table', () => {
    render(<LeadsBarChart title="Lead per layanan" data={[{ label: 'AI Build', value: 3 }]} />)
    expect(screen.getByText('AI Build: 3')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Lihat sebagai tabel' }))
    expect(screen.getByRole('table')).toBeTruthy()
  })
  it('links status chips to the filtered lead list', () => {
    render(<StatusDonut data={[{ status: 'new', value: 2 }]} />)
    expect(screen.getByRole('link', { name: /Baru 2/ }).getAttribute('href')).toBe(
      '/admin/leads?status=new',
    )
  })
})
