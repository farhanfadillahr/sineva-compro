'use client'
import { useActionState, useRef, useState } from 'react'
import { Dialog } from '@/components/admin/overlays'
import { setEditorActiveAction } from '../actions'
import { ActionFeedback } from './action-feedback'
import type { UserSummary, UserActionState } from '../types'
const initial: UserActionState = { status: 'idle', message: '' }
export function EditorStatusForm({ editor }: { editor: UserSummary }) {
  const [state, action, pending] = useActionState(setEditorActiveAction, initial)
  const [confirming, setConfirming] = useState(false)
  const form = useRef<HTMLFormElement>(null)
  return (
    <form ref={form} action={action} className="users-form" aria-busy={pending}>
      <input type="hidden" name="userId" value={editor.id} />
      <input type="hidden" name="active" value={String(!editor.active)} />
      <p className="muted">
        {editor.active
          ? 'Menonaktifkan akun akan mengeluarkan Editor dari semua perangkat.'
          : 'Editor dapat masuk kembali setelah akun diaktifkan.'}
      </p>
      <ActionFeedback state={state} id="status-feedback" />
      {editor.active ? (
        // Deactivating signs the Editor out everywhere, so it asks first like other risky actions.
        <button
          className="button-secondary"
          type="button"
          disabled={pending}
          onClick={() => setConfirming(true)}
        >
          {pending ? 'Sedang menyimpan…' : 'Nonaktifkan akun'}
        </button>
      ) : (
        <button className="button-secondary" type="submit" disabled={pending}>
          {pending ? 'Sedang menyimpan…' : 'Aktifkan akun'}
        </button>
      )}
      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Nonaktifkan akun"
        confirmLabel="Nonaktifkan"
        onConfirm={() => {
          setConfirming(false)
          form.current?.requestSubmit()
        }}
      >
        <p>
          {editor.name} akan keluar dari semua perangkat dan tidak bisa masuk sampai akunnya
          diaktifkan lagi.
        </p>
      </Dialog>
    </form>
  )
}
