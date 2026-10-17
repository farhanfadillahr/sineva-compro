// @vitest-environment jsdom
import React, { useState } from 'react'
import { afterEach, beforeAll, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dialog, DropdownMenu, Drawer, Popover } from '@/components/admin/overlays'
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
})
afterEach(cleanup)
it('traps focus, requires exact destructive name, closes with Escape and restores trigger focus', async () => {
  const user = userEvent.setup()
  let removed = false
  function Fixture() {
    const [open, set] = useState(false)
    return (
      <>
        <button onClick={() => set(true)}>Hapus artikel</button>
        <Dialog
          open={open}
          onClose={() => set(false)}
          title="Hapus artikel"
          confirmName="Artikel A"
          onConfirm={() => {
            removed = true
            set(false)
          }}
        >
          <p>Tindakan ini permanen.</p>
        </Dialog>
      </>
    )
  }
  render(<Fixture />)
  const trigger = screen.getByRole('button', { name: 'Hapus artikel' })
  await user.click(trigger)
  const confirm = screen.getByRole('button', { name: 'Konfirmasi' }) as HTMLButtonElement
  expect(confirm.disabled).toBe(true)
  await user.type(screen.getByLabelText('Ketik Artikel A untuk melanjutkan'), 'Artikel A')
  expect(confirm.disabled).toBe(false)
  confirm.focus()
  await user.tab()
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Tutup' }))
  await user.keyboard('{Escape}')
  expect(trigger).toBe(document.activeElement)
  expect(removed).toBe(false)
  await user.click(trigger)
  expect((screen.getByRole('button', { name: 'Konfirmasi' }) as HTMLButtonElement).disabled).toBe(
    true,
  )
})
it('navigates dropdown with arrows, Home/End and Escape', async () => {
  const user = userEvent.setup()
  let picked = ''
  render(
    <DropdownMenu
      label="Akun"
      items={[
        {
          label: 'Profil saya',
          onSelect: () => {
            picked = 'profile'
          },
        },
        {
          label: 'Keluar',
          onSelect: () => {
            picked = 'logout'
          },
        },
      ]}
    />,
  )
  const trigger = screen.getByRole('button', { name: 'Akun' })
  trigger.focus()
  await user.keyboard('{ArrowDown}{End}{Enter}')
  expect(picked).toBe('logout')
  expect(document.activeElement).toBe(trigger)
  await user.click(trigger)
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('menu')).toBeNull()
})
it('gives the drawer an accessible modal title and close action', async () => {
  const user = userEvent.setup()
  function Fixture() {
    const [open, set] = useState(true)
    return (
      <Drawer open={open} onClose={() => set(false)} title="Detail">
        <p>Isi</p>
      </Drawer>
    )
  }
  render(<Fixture />)
  expect(screen.getByRole('dialog', { name: 'Detail' })).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'Tutup' }))
  expect(screen.queryByRole('dialog')).toBeNull()
})

it('opens a non-modal popover, supports Escape and restores the trigger', async () => {
  const user = userEvent.setup()
  render(
    <Popover label="Bantuan judul" title="Panduan judul">
      <p>Gunakan judul singkat.</p>
      <button>Selesai membaca</button>
    </Popover>,
  )
  const trigger = screen.getByRole('button', { name: 'Bantuan judul' })
  await user.click(trigger)
  const popup = screen.getByRole('dialog', { name: 'Panduan judul' })
  expect(popup.getAttribute('aria-modal')).toBe('false')
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Selesai membaca' }))
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.activeElement).toBe(trigger)
})
