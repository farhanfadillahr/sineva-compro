// @vitest-environment jsdom
import React from 'react'
import { afterEach, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { TeamVisibility } from '@/features/collections/components/team-visibility'

afterEach(cleanup)

// CPR-106: three switches on three screens decide whether About shows the team.
it('says the team is hidden and lists what is still off, with where to change it', () => {
  render(<TeamVisibility featureOn={false} sectionOn={true} shownMembers={2} />)
  expect(screen.getByText('Bagian tim belum tampil di halaman Tentang.')).toBeTruthy()
  const list = screen.getByRole('list', { name: 'Syarat bagian tim tampil' })
  const items = within(list)
    .getAllByRole('listitem')
    .map((li) => li.textContent)
  expect(items[0]).toContain('Belum: ')
  expect(items[1]).toContain('Terpenuhi: ')
  expect(items[2]).toContain('2 anggota')
  expect(
    within(list)
      .getByRole('link', { name: /Pengaturan > Situs/ })
      .getAttribute('href'),
  ).toBe('/admin/settings')
  expect(
    within(list)
      .getByRole('link', { name: /Halaman > Tentang/ })
      .getAttribute('href'),
  ).toBe('/admin/pages/about')
})

it('confirms when all three are on', () => {
  render(<TeamVisibility featureOn sectionOn shownMembers={1} />)
  expect(screen.getByText('Bagian tim tampil di halaman Tentang.')).toBeTruthy()
})

it('treats a team without shown members as hidden', () => {
  render(<TeamVisibility featureOn sectionOn shownMembers={0} />)
  expect(screen.getByText('Bagian tim belum tampil di halaman Tentang.')).toBeTruthy()
})
