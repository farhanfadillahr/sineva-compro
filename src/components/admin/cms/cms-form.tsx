'use client'
import { useActionState, useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { idleState, type CmsActionState } from '@/features/cms/errors'
import type { FieldErrors } from '@/features/cms/fields'
import { InlineBanner, Toast } from '../feedback'
import { AdminButton } from '../primitives'
import c from './cms.module.css'
import s from '../admin.module.css'

export type CmsAction = (previous: CmsActionState, form: FormData) => Promise<CmsActionState>

/**
 * Shell for every CMS editor: keeps the document as JSON state, submits it in one hidden field to
 * a server action, shows field errors by path and guards against leaving with unsaved changes.
 */
export function CmsForm<T>({
  action,
  initialValue,
  children,
  side,
  submitLabel = 'Simpan perubahan',
  hidden,
  redirectTo,
  secondaryActions,
}: {
  action: CmsAction
  initialValue: T
  children: (value: T, setValue: (value: T) => void, errors: FieldErrors) => ReactNode
  side?: (value: T) => ReactNode
  submitLabel?: string
  /** Extra hidden fields, for example the record id or the action intent. */
  hidden?: Readonly<Record<string, string>>
  /** After a successful create, go to `redirectTo(id)`. */
  redirectTo?: (id: string) => string
  secondaryActions?: (value: T, pending: boolean) => ReactNode
}) {
  const router = useRouter()
  const [state, submit, pending] = useActionState(action, idleState)
  const [value, setValueState] = useState(initialValue)
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useState(false)
  const seen = useRef<CmsActionState>(idleState)
  const setValue = (next: T) => {
    setValueState(next)
    setDirty(true)
  }
  useEffect(() => {
    if (state === seen.current) return
    seen.current = state
    if (state.status !== 'success') return
    // Acknowledging a finished save: these mirror the server result, not derived render state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDirty(false)
    setToast(true)
    if (state.id && redirectTo) router.replace(redirectTo(state.id))
    else router.refresh()
  }, [state, redirectTo, router])
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  const errors = state.status === 'error' ? (state.errors ?? {}) : {}
  return (
    <form action={submit} aria-busy={pending} className={s.stack} noValidate>
      <input type="hidden" name="payload" value={JSON.stringify(value)} />
      {Object.entries(hidden ?? {}).map(([name, v]) => (
        <input key={name} type="hidden" name={name} value={v} />
      ))}
      {state.status === 'error' ? <InlineBanner tone="error">{state.message}</InlineBanner> : null}
      {dirty ? (
        <InlineBanner tone="warning">Ada perubahan yang belum disimpan.</InlineBanner>
      ) : null}
      <div className={side ? s.formLayout : s.stack}>
        <div className={s.stack}>{children(value, setValue, errors)}</div>
        {side ? (
          <aside className={s.stack} aria-label="Status dan publikasi">
            {side(value)}
          </aside>
        ) : null}
      </div>
      <div className={c.actions}>
        {secondaryActions?.(value, pending)}
        <AdminButton tone="primary" type="submit" disabled={pending}>
          {pending ? 'Sedang menyimpan…' : submitLabel}
        </AdminButton>
      </div>
      {toast && state.status === 'success' ? (
        <Toast message={state.message} onDismiss={() => setToast(false)} />
      ) : null}
    </form>
  )
}
