'use client'
import { useActionState, useEffect, useRef } from 'react'
import { changeEditorPasswordAction } from '../actions'
import { ActionFeedback } from './action-feedback'
import type { UserActionState } from '../types'
const initial: UserActionState = { status: 'idle', message: '' }
export function EditorPasswordForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(changeEditorPasswordAction, initial)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (state.status === 'success' && input.current) input.current.value = ''
  }, [state])
  return (
    <form action={action} className="auth-form users-form" aria-busy={pending}>
      <input type="hidden" name="userId" value={userId} />
      <div className="form-field">
        <label htmlFor="new-password">Password baru</label>
        <input
          ref={input}
          id="new-password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
          aria-describedby="new-password-hint"
        />
        <p className="field-hint" id="new-password-hint">
          12–128 karakter. Semua session Editor akan diakhiri.
        </p>
      </div>
      <ActionFeedback state={state} id="password-feedback" />
      <button className="button-primary" type="submit" disabled={pending}>
        {pending ? 'Sedang mengganti…' : 'Ganti password'}
      </button>
    </form>
  )
}
