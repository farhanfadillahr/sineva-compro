// @vitest-environment jsdom
import React, { useState } from 'react'
import Link from 'next/link'
import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DatePicker } from '@/components/admin/date-picker'
import { SortableList } from '@/components/admin/sortable-list'
import { RichTextEditor } from '@/components/admin/rich-text-editor'
import { Toast, InlineBanner, Progress } from '@/components/admin/feedback'
import {
  Avatar,
  StatCard,
  ListCard,
  ActivityFeed,
  CompletenessCard,
  DescriptionList,
  EmptyState,
  Skeleton,
  Tooltip,
} from '@/components/admin/display'
beforeAll(() => {
  Object.defineProperty(document, 'elementFromPoint', {
    configurable: true,
    value: () => document.querySelector('[contenteditable="true"]') ?? document.body,
  })
  Object.defineProperty(Range.prototype, 'getClientRects', {
    configurable: true,
    value: () => [new DOMRect(0, 0, 120, 20)],
  })
  Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: () => new DOMRect(0, 0, 120, 20),
  })
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
it('selects an Indonesian Monday-first calendar date and returns a UTC ISO value', async () => {
  const user = userEvent.setup()
  let iso = ''
  render(
    <DatePicker
      label="Tanggal terbit"
      value="2026-10-15T00:00:00.000Z"
      onChange={(v) => {
        iso = v ?? ''
      }}
    />,
  )
  await user.click(screen.getByRole('button', { name: /Tanggal terbit/ }))
  const dialog = screen.getByRole('dialog', { name: 'Tanggal terbit' })
  expect(dialog.querySelector('thead th')?.getAttribute('aria-label')).toBe('Senin')
  expect(within(dialog).getByRole('button', { name: 'Bulan berikutnya' })).toBeTruthy()
  await user.click(within(dialog).getByRole('button', { name: /Jumat, 16 Oktober 2026/ }))
  expect(iso).toBe(new Date(2026, 9, 16).toISOString())
})
it('moves a sortable item with Space, arrows and Space and announces the result', async () => {
  const originalRect = HTMLElement.prototype.getBoundingClientRect
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const item = this.closest('li')
    if (item?.parentElement?.getAttribute('aria-label') === 'Urutan') {
      const index = Array.from(item.parentElement.children).indexOf(item)
      return new DOMRect(0, index * 48, 320, 48)
    }
    return originalRect.call(this)
  })
  const user = userEvent.setup()
  function Fixture() {
    const [items, set] = useState([
      { id: 'a', label: 'Pertama' },
      { id: 'b', label: 'Kedua' },
    ])
    return <SortableList label="Urutan" items={items} onChange={set} renderItem={(i) => i.label} />
  }
  render(<Fixture />)
  screen.getByRole('button', { name: 'Pindahkan Pertama' }).focus()
  await user.keyboard(' {ArrowDown} ')
  await waitFor(() =>
    expect(
      screen.getAllByRole('listitem').map((i) => i.textContent?.replace(/[↕↑↓]/g, '').trim()),
    ).toEqual(['Kedua', 'Pertama']),
  )
})
it('edits structured Tiptap JSON, marks a heading, flags forbidden punctuation and updates toolbar state', async () => {
  const user = userEvent.setup()
  let json = ''
  render(
    <RichTextEditor
      label="Isi artikel"
      name="body"
      onChange={(v) => {
        json = JSON.stringify(v)
      }}
    />,
  )
  const input = await screen.findByRole('textbox', { name: 'Isi artikel' })
  await user.click(input)
  await user.type(input, 'Halo — tim')
  await waitFor(() => expect(json).toContain('Halo — tim'))
  expect(screen.getByRole('alert').textContent).toContain('Gunakan koma')
  await user.selectOptions(screen.getByLabelText('Gaya paragraf'), 'h2')
  await waitFor(() => expect(json).toContain('heading'))
  expect(screen.getByText(/3 kata/)).toBeTruthy()
})
it('opens slash blocks in a blank paragraph and inserts a selected heading', async () => {
  const user = userEvent.setup()
  let json = ''
  render(
    <RichTextEditor
      label="Isi baru"
      name="body"
      onChange={(value) => {
        json = JSON.stringify(value)
      }}
    />,
  )
  const input = await screen.findByRole('textbox', { name: 'Isi baru' })
  await user.click(input)
  await user.type(input, '/')
  const menu = await screen.findByRole('menu', { name: 'Sisipkan blok' })
  await user.click(within(menu).getByRole('menuitem', { name: 'Judul H2' }))
  await waitFor(() => expect(json).toContain('heading'))
  expect(screen.queryByRole('menu', { name: 'Sisipkan blok' })).toBeNull()
})

it('announces feedback, clamps progress and exposes retry and dismiss actions', async () => {
  const user = userEvent.setup()
  let retry = false
  let dismissed = false
  render(
    <>
      <Toast
        tone="error"
        message="Gagal menyimpan"
        onRetry={() => {
          retry = true
        }}
        onDismiss={() => {
          dismissed = true
        }}
      />
      <InlineBanner tone="warning">Perubahan belum disimpan</InlineBanner>
      <Progress label="Unggah" value={140} />
    </>,
  )
  expect(screen.getByRole('status').textContent).toContain('Gagal menyimpan')
  expect((screen.getByRole('progressbar', { name: 'Unggah' }) as HTMLProgressElement).value).toBe(
    100,
  )
  await user.click(screen.getByRole('button', { name: 'Coba lagi' }))
  await user.click(screen.getByRole('button', { name: 'Tutup notifikasi' }))
  expect(retry && dismissed).toBe(true)
})
it('renders real summary, feed, completeness links and labelled display states', async () => {
  const user = userEvent.setup()
  render(
    <>
      <Avatar name="Farhan Rafi" />
      <StatCard label="Draft" value={3} href="/admin/blog?status=draft" />
      <ListCard
        title="Terbaru"
        href="/admin/blog"
        items={[{ id: '1', title: 'Artikel A', href: '/admin/blog/1' }]}
      />
      <ActivityFeed
        items={[
          {
            id: '1',
            actor: 'Farhan',
            action: 'menerbitkan Artikel A',
            date: '2026-10-15T12:00:00Z',
          },
        ]}
      />
      <CompletenessCard
        locales={[{ code: 'en', percent: 50, missing: [{ label: 'Judul', href: '#title' }] }]}
      />
      <DescriptionList items={[{ label: 'Email', value: 'hello@example.com' }]} />
      <EmptyState
        message="Belum ada artikel"
        action={<Link href="/admin/blog/new">Tambah artikel</Link>}
      />
      <Skeleton label="Memuat panel" />
      <Tooltip label="Informasi tanggal">
        <button>Tanggal</button>
      </Tooltip>
    </>,
  )
  expect(screen.getByRole('img', { name: 'Farhan Rafi' }).textContent).toBe('FR')
  expect(screen.getByRole('link', { name: /Draft.*3/ }).getAttribute('href')).toBe(
    '/admin/blog?status=draft',
  )
  expect(screen.getByRole('link', { name: 'Judul' }).getAttribute('href')).toBe('#title')
  expect(screen.getByRole('progressbar', { name: 'EN' }).getAttribute('value')).toBe('50')
  await user.tab()
  screen.getByRole('button', { name: 'Tanggal' }).focus()
  await waitFor(() => expect(screen.getByRole('tooltip').textContent).toBe('Informasi tanggal'))
})

it('offers single-click move controls and announces the new position without dragging', async () => {
  const user = userEvent.setup()
  function Fixture() {
    const [items, setItems] = useState([
      { id: 'a', label: 'Pertama' },
      { id: 'b', label: 'Kedua' },
    ])
    return (
      <SortableList
        label="Urutan"
        items={items}
        onChange={setItems}
        renderItem={(item) => item.label}
      />
    )
  }
  render(<Fixture />)
  expect(
    (screen.getByRole('button', { name: 'Naikkan Pertama' }) as HTMLButtonElement).disabled,
  ).toBe(true)
  await user.click(screen.getByRole('button', { name: 'Turunkan Pertama' }))
  expect(
    screen.getAllByRole('listitem').map((item) => item.textContent?.replace(/[↕↑↓]/g, '').trim()),
  ).toEqual(['Kedua', 'Pertama'])
  expect(screen.getByRole('status', { name: 'Status Urutan' }).textContent).toContain(
    'Pertama dipindahkan ke posisi 2',
  )
})
