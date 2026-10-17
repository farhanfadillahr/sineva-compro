'use client'
import { startTransition, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { idleState } from '@/features/cms/errors'
import type { CmsAction } from './cms-form'
import { Dialog } from '../overlays'
import { AdminButton } from '../primitives'
import { InlineBanner } from '../feedback'

/**
 * A destructive or state-changing action behind a confirmation dialog. With `confirmName`, the
 * editor must type the record's name first (admin-ui.md section 4.8).
 *
 * The action is called directly instead of through a hidden <form>: editors render this inside
 * CmsForm's <form>, and a nested form can never be submitted (publish and delete did nothing).
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
  const [state, setState] = useState(idleState)
  const [pending, startPending] = useTransition()

  function run() {
    const data = new FormData()
    for (const [name, value] of Object.entries(fields)) data.append(name, value)
    startPending(async () => {
      const next = await action(state, data)
      // Navigate inside the same transition, not from an effect: a delete refreshes the current
      // route (the deleted record's editor, now a 404), which unmounts this component first.
      if (next.status === 'success') {
        if (redirectTo) router.replace(redirectTo)
        else router.refresh()
      }
      startTransition(() => setState(next))
    })
  }

  return (
    <>
      <AdminButton tone={tone} onClick={() => setOpen(true)} disabled={pending}>
        {label}
      </AdminButton>
      {state.status === 'error' ? <InlineBanner tone="error">{state.message}</InlineBanner> : null}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        confirmName={confirmName}
        confirmLabel={confirmLabel}
        onConfirm={() => {
          setOpen(false)
          run()
        }}
      >
        <p>{description}</p>
      </Dialog>
    </>
  )
}
