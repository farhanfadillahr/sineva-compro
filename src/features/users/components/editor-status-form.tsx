'use client'
import { useActionState } from 'react'
import { setEditorActiveAction } from '../actions'
import { ActionFeedback } from './action-feedback'
import type { UserSummary, UserActionState } from '../types'
const initial: UserActionState = { status: 'idle', message: '' }
export function EditorStatusForm({ editor }: { editor: UserSummary }) {
  const [state, action, pending] = useActionState(setEditorActiveAction, initial)
  return (
    <form action={action} className="users-form" aria-busy={pending}>
      <input type="hidden" name="userId" value={editor.id} />
      <input type="hidden" name="active" value={String(!editor.active)} />
      <p className="muted">
        {editor.active
          ? 'Menonaktifkan akun akan mengeluarkan Editor dari semua perangkat.'
          : 'Editor dapat masuk kembali setelah akun diaktifkan.'}
      </p>
      <ActionFeedback state={state} id="status-feedback" />
      <button className="button-secondary" type="submit" disabled={pending}>
        {pending ? 'Sedang menyimpan…' : editor.active ? 'Nonaktifkan akun' : 'Aktifkan akun'}
      </button>
    </form>
  )
}
