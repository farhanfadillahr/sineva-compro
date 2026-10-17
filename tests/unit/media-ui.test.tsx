import React from 'react'
import { beforeAll, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MediaDropzone } from '@/components/admin/media/dropzone'
import { ImageField } from '@/components/admin/media/image-field'
import { MediaDetails } from '@/components/admin/media/details'
import { MediaPicker } from '@/components/admin/media/picker'
import type { MediaItem } from '@/features/media/types'
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const image = { ...props }
    delete image.unoptimized
    delete image.fill
    return React.createElement('img', image)
  },
}))
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
})
const item: MediaItem = {
  id: '06e10b40-ec4d-4880-826c-d7d2e0001111',
  filename: 'office.png',
  kind: 'image',
  contentType: 'image/png',
  size: 100,
  width: 8,
  height: 4,
  dominantColor: '#ff0000',
  credit: '',
  focalX: 0.5,
  focalY: 0.5,
  translations: { en: { alt: 'Office', caption: '' } },
  previewUrl: '/preview',
  publicUrl: null,
  usageCount: 0,
  usages: [],
}
it('validates selected files and requires alt before uploading', async () => {
  const user = userEvent.setup({ applyAccept: false })
  render(<MediaDropzone onUploaded={() => {}} />)
  await user.upload(
    screen.getByLabelText('Pilih file media'),
    new File(['<html>'], 'bad.svg', { type: 'image/svg+xml' }),
  )
  expect(screen.getByRole('alert').textContent).toContain('tidak didukung')
  await user.upload(
    screen.getByLabelText('Pilih file media'),
    new File(['png'], 'office.png', { type: 'image/png' }),
  )
  const submit = screen.getByRole('button', { name: 'Unggah office.png' })
  expect((submit as HTMLButtonElement).disabled).toBe(true)
  await user.type(screen.getByLabelText('Alt (en) untuk office.png'), 'Office')
  // Both locales are enabled (CPR-101): the Indonesian alt is required too.
  expect((submit as HTMLButtonElement).disabled).toBe(true)
  await user.type(screen.getByLabelText('Alt (id) untuk office.png'), 'Kantor')
  expect((submit as HTMLButtonElement).disabled).toBe(false)
})
it('image field provides keyboard focal controls and clear without changing an unrelated file', async () => {
  const user = userEvent.setup(),
    onChange = vi.fn()
  render(<ImageField label="Foto tim" value={item} onChange={onChange} />)
  screen.getByRole('button', { name: 'Pilih titik fokus gambar' }).focus()
  await user.keyboard('{ArrowRight}')
  expect(onChange).toHaveBeenCalled()
  expect(onChange.mock.calls[0][0].id).toBe(item.id)
  await user.click(screen.getByRole('button', { name: 'Hapus pilihan Foto tim' }))
  expect(onChange).toHaveBeenLastCalledWith(null)
})
it('picker fetches only image pages, selects an image, and closes through its controlled callback', async () => {
  const fetcher = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ items: [item], page: 1, total: 1, pageSize: 20 }), {
      status: 200,
    }),
  )
  vi.stubGlobal('fetch', fetcher)
  const user = userEvent.setup(),
    choose = vi.fn(),
    close = vi.fn()
  render(<MediaPicker open onClose={close} onChoose={choose} />)
  await waitFor(() => expect(screen.getByRole('button', { name: 'Pilih office.png' })).toBeTruthy())
  expect(String(fetcher.mock.calls[0][0])).toContain('kind=image')
  await user.click(screen.getByRole('button', { name: 'Pilih office.png' }))
  expect(choose).toHaveBeenCalledWith(item)
  expect(close).toHaveBeenCalled()
  vi.unstubAllGlobals()
})

it('announces a successful metadata save inside the active drawer', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(item), { status: 200 })),
  )
  const user = userEvent.setup()
  render(<MediaDetails item={item} onClose={() => {}} onSaved={() => {}} onRemoved={() => {}} />)
  await user.click(screen.getByRole('button', { name: /^Simpan metadata$/ }))
  await waitFor(() =>
    expect(screen.getByRole('status').textContent).toContain('Metadata berhasil disimpan'),
  )
  vi.unstubAllGlobals()
})
