'use client'
import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { idleState } from '@/features/cms/errors'
import type { CmsAction } from './cms-form'
import { Dialog } from '../overlays'
import { AdminButton } from '../primitives'
import { InlineBanner } from '../feedback'

/**
 * A destructive or state-changing action behind a confirmation dialog. With `confirmName`, the
 * editor must type the record's name first (admin-ui.md section 4.8).
 */
export function ConfirmAction({
  action,
  fields,
  label,
  title,
  description,
  confirmName,
  confirmLabel = 'Hapus',
  tone = 'danger',
  redirectTo,
}: {
  action: CmsAction
  fields: Readonly<Record<string, string>>
  label: string
  title: string
  description: string
  confirmName?: string
  confirmLabel?: string
  tone?: 'danger' | 'primary' | 'secondary'
  redirectTo?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, submit, pending] = useActionState(action, idleState)
  const form = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state.status !== 'success') return
    if (redirectTo) router.replace(redirectTo)
    else router.refresh()
  }, [state, redirectTo, router])
  return (
    <>
      <AdminButton tone={tone} onClick={() => setOpen(true)} disabled={pending}>
        {label}
      </AdminButton>
      {state.status === 'error' ? <InlineBanner tone="error">{state.message}</InlineBanner> : null}
      <form ref={form} action={submit} hidden>
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      </form>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        confirmName={confirmName}
        confirmLabel={confirmLabel}
        onConfirm={() => {
          setOpen(false)
          form.current?.requestSubmit()
        }}
      >
        <p>{description}</p>
      </Dialog>
    </>
  )
}
