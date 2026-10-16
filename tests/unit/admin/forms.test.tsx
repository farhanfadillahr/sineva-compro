// @vitest-environment jsdom
import React, { useState } from 'react'
import { afterEach, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  ContentField,
  LocaleTabs,
  SlugInput,
  SecretField,
  MultiSelect,
  Toggle,
  RadioCards,
  ChoicePicker,
} from '@/components/admin/forms'
afterEach(cleanup)
it('blocks a real form submit above the limit and replaces forbidden punctuation', async () => {
  const user = userEvent.setup()
  let submitted = false
  render(
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submitted = true
      }}
    >
      <ContentField label="Judul" name="title" limit={10} defaultValue="123456789" />
      <button>Simpan</button>
    </form>,
  )
  const input = screen.getByRole('textbox', { name: 'Judul' }) as HTMLInputElement
  await user.type(input, '01')
  expect(input.validity.valid).toBe(false)
  await user.click(screen.getByText('Simpan'))
  expect(submitted).toBe(false)
  await user.clear(input)
  await user.type(input, 'AI — tim')
  expect(screen.getByRole('alert').textContent).toContain('Gunakan koma')
  await user.click(screen.getByRole('button', { name: 'Ganti tanda baca' }))
  expect(input.value).toBe('AI, tim')
  await user.click(screen.getByText('Simpan'))
  expect(submitted).toBe(true)
})
it('hides tabs for one locale, supports arrows and exposes completion for enabled locales', async () => {
  const user = userEvent.setup()
  const { rerender } = render(
    <LocaleTabs
      locales={[{ code: 'en', label: 'English', complete: true }]}
      value="en"
      onChange={() => {}}
    />,
  )
  expect(screen.queryByRole('tablist')).toBeNull()
  let selected = ''
  rerender(
    <LocaleTabs
      locales={[
        { code: 'en', label: 'English', complete: true },
        { code: 'id', label: 'Indonesia', complete: false },
      ]}
      value="en"
      onChange={(v) => {
        selected = v
      }}
    />,
  )
  screen.getByRole('tab', { name: /English.*Lengkap/ }).focus()
  await user.keyboard('{ArrowRight}')
  expect(selected).toBe('id')
  expect(document.activeElement?.getAttribute('aria-label')).toContain('Belum lengkap')
})
it('generates slug until manual editing and warns about redirects on a published slug', async () => {
  const user = userEvent.setup()
  const { rerender } = render(<SlugInput title="Hello World" prefix="/blog/" name="slug" />)
  expect((screen.getByLabelText('Slug') as HTMLInputElement).value).toBe('hello-world')
  await user.clear(screen.getByLabelText('Slug'))
  await user.type(screen.getByLabelText('Slug'), 'manual')
  rerender(
    <SlugInput title="Different title" prefix="/blog/" name="slug" publishedSlug="old-slug" />,
  )
  expect((screen.getByLabelText('Slug') as HTMLInputElement).value).toBe('manual')
  expect(screen.getByRole('status').textContent).toContain('Redirect 301')
})
it('keeps secrets write-only and disables environment-managed replacement', () => {
  render(<SecretField name="smtp" label="Kata sandi SMTP" configured managedByEnvironment />)
  const input = screen.getByLabelText('Kata sandi SMTP') as HTMLInputElement
  expect(input.value).toBe('')
  expect(input.disabled).toBe(true)
  expect(input.type).toBe('password')
  expect(screen.getByRole('status').textContent).toContain('environment')
})
it('filters multiselect with keyboard and removes selected chips', async () => {
  const user = userEvent.setup()
  function Fixture() {
    const [value, set] = useState<string[]>([])
    return (
      <MultiSelect
        label="Kategori"
        options={[
          { value: 'ai', label: 'AI' },
          { value: 'ops', label: 'Operasi' },
        ]}
        value={value}
        onChange={set}
      />
    )
  }
  render(<Fixture />)
  const input = screen.getByRole('combobox', { name: 'Kategori' })
  await user.type(input, 'Oper')
  await user.keyboard('{ArrowDown}{Enter}')
  expect(screen.getByRole('button', { name: 'Hapus Operasi' })).toBeTruthy()
  await user.click(screen.getByRole('button', { name: 'Hapus Operasi' }))
  expect(screen.queryByRole('button', { name: 'Hapus Operasi' })).toBeNull()
})
it('submits native switch and radio-card values and exposes choice selection', async () => {
  const user = userEvent.setup()
  render(
    <form aria-label="Pilihan">
      <Toggle label="Tampilkan" name="visible" defaultChecked />
      <RadioCards
        label="Mode"
        name="mode"
        options={[
          { value: 'smtp', label: 'SMTP' },
          { value: 'api', label: 'API' },
        ]}
        defaultValue="smtp"
      />
      <ChoicePicker
        label="Pose"
        name="pose"
        options={[{ value: 'wave', label: 'Melambai', preview: <span>◉</span> }]}
      />
    </form>,
  )
  await user.click(screen.getByLabelText('API'))
  await user.click(screen.getByLabelText('Melambai'))
  const form = screen.getByRole('form', { name: 'Pilihan' }) as HTMLFormElement
  expect(Object.fromEntries(new FormData(form))).toEqual({
    visible: 'on',
    mode: 'api',
    pose: 'wave',
  })
})
