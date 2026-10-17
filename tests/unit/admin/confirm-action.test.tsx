// @vitest-environment jsdom
import React from 'react'
import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmAction } from '@/components/admin/cms/confirm-action'
import type { CmsActionState } from '@/features/cms/errors'

const router = { replace: vi.fn(), refresh: vi.fn() }
vi.mock('next/navigation', () => ({ useRouter: () => router }))

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
})
afterEach(cleanup)

// Editors place ConfirmAction inside CmsForm's <form> (the publish panel and the delete button).
// A nested <form> cannot be submitted, so publish, unpublish and delete silently did nothing.
it('runs its action with the hidden fields while rendered inside another form', async () => {
  const user = userEvent.setup()
  const received: Record<string, FormDataEntryValue>[] = []
  const action = vi.fn(async (_previous: CmsActionState, form: FormData) => {
    received.push(Object.fromEntries(form))
    return { status: 'success', message: 'Terbit.' } as CmsActionState
  })
  const { container } = render(
    <form>
      <ConfirmAction
        action={action}
        fields={{ document: 'posts', id: 'post-1' }}
        label="Terbitkan"
        title="Terbitkan draf"
        description="Draf akan tampil di situs."
        confirmLabel="Terbitkan"
        tone="primary"
        redirectTo="/admin/blog"
      />
    </form>,
  )

  expect(container.querySelectorAll('form form')).toHaveLength(0)

  await user.click(screen.getByRole('button', { name: 'Terbitkan' }))
  const dialog = screen.getByRole('dialog', { hidden: true })
  await user.click(
    Array.from(dialog.querySelectorAll('button')).find((b) => b.textContent === 'Terbitkan')!,
  )

  await waitFor(() => expect(action).toHaveBeenCalledTimes(1))
  expect(received).toEqual([{ document: 'posts', id: 'post-1' }])
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/admin/blog'))
})

// Deleting refreshes the current route, which is the editor of the record that no longer exists.
// That render unmounts ConfirmAction, so navigating from an effect after the state change never
// happened and the editor was left on a 404 page.
it('navigates to redirectTo even when the action response unmounts it', async () => {
  const user = userEvent.setup()
  router.replace.mockClear()
  let unmount: () => void = () => {}
  const action = vi.fn(async () => {
    unmount()
    return { status: 'success', message: 'Dihapus.' } as CmsActionState
  })
  ;({ unmount } = render(
    <ConfirmAction
      action={action}
      fields={{ id: 'post-1' }}
      label="Hapus"
      title="Hapus artikel"
      description="Draf akan dihapus."
      redirectTo="/admin/blog"
    />,
  ))

  await user.click(screen.getByRole('button', { name: 'Hapus' }))
  const dialog = screen.getByRole('dialog', { hidden: true })
  await user.click(
    Array.from(dialog.querySelectorAll('button')).find((b) => b.textContent === 'Hapus')!,
  )

  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/admin/blog'))
})

it('requires the typed name before a destructive action runs', async () => {
  const user = userEvent.setup()
  const action = vi.fn(async () => ({ status: 'success', message: 'Dihapus.' }) as CmsActionState)
  render(
    <form>
      <ConfirmAction
        action={action}
        fields={{ id: 'faq-1' }}
        label="Hapus"
        title="Hapus pertanyaan"
        description="Item ini akan hilang dari situs."
        confirmName="what-is-sino"
      />
    </form>,
  )

  await user.click(screen.getByRole('button', { name: 'Hapus' }))
  const dialog = screen.getByRole('dialog', { hidden: true })
  const confirm = Array.from(dialog.querySelectorAll('button')).find(
    (b) => b.textContent === 'Hapus',
  )!
  expect(confirm.disabled).toBe(true)
  await user.type(screen.getByLabelText('Ketik what-is-sino untuk melanjutkan'), 'what-is-sino')
  await user.click(confirm)

  await waitFor(() => expect(action).toHaveBeenCalledTimes(1))
})
