'use client'
import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createEditorAction, updateEditorAction } from '../actions'
import { ActionFeedback } from './action-feedback'
import type { UserActionState, UserSummary } from '../types'
const initial: UserActionState = { status: 'idle', message: '' }
export function UserForm({ editor }: { editor?: UserSummary }) {
  const router = useRouter()
  const password = useRef<HTMLInputElement>(null)
  const [state, action, pending] = useActionState(
    editor ? updateEditorAction : createEditorAction,
    initial,
  )
  useEffect(() => {
    if (state.status === 'success') {
      if (password.current) password.current.value = ''
      if (state.userId) router.replace(`/admin/users/${encodeURIComponent(state.userId)}`)
    }
  }, [state, router])
  return (
    <form action={action} className="auth-form users-form" aria-busy={pending}>
      {editor ? <input type="hidden" name="userId" value={editor.id} /> : null}
      <div className="form-field">
        <label htmlFor="editor-name">Nama</label>
        <input
          id="editor-name"
          name="name"
          autoComplete="name"
          defaultValue={editor?.name}
          required
          minLength={2}
          maxLength={80}
        />
      </div>
      <div className="form-field">
        <label htmlFor="editor-email">Email</label>
        <input
          id="editor-email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={editor?.email}
          required
          maxLength={254}
        />
      </div>
      {!editor ? (
        <div className="form-field">
          <label htmlFor="editor-password">Password awal</label>
          <input
            ref={password}
            id="editor-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={128}
            aria-describedby="password-hint"
          />
          <p id="password-hint" className="field-hint">
            Gunakan 12–128 karakter.
          </p>
        </div>
      ) : null}
      <ActionFeedback state={state} id="identity-feedback" />
      <button className="button-primary" disabled={pending} type="submit">
        {pending ? 'Sedang menyimpan…' : editor ? 'Simpan perubahan' : 'Buat akun Editor'}
      </button>
    </form>
  )
}
