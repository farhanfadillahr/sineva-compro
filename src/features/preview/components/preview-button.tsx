'use client'
import { useState, useTransition } from 'react'
import { AdminButton } from '@/components/admin/primitives'
import { idleState } from '../../cms/errors'
import { createPreviewAction } from '../actions'
import s from '@/components/admin/admin.module.css'

/**
 * Opens the real page with the current, unsaved form state in a new tab. The tab is opened
 * synchronously (popup blockers) and pointed at the signed link once the state is stored.
 */
export function PreviewButton({
  kind,
  target,
  locale,
  data,
}: {
  kind: 'page' | 'service'
  target: string
  locale: string
  data: unknown
}) {
  const [pending, start] = useTransition()
  const [error, setError] = useState('')
  return (
    <div className={s.stack}>
      <AdminButton
        disabled={pending}
        onClick={() => {
          const tab = window.open('about:blank', '_blank')
          setError('')
          start(async () => {
            const form = new FormData()
            form.set('payload', JSON.stringify({ kind, target, locale, data }))
            const result = await createPreviewAction(idleState, form)
            if (result.status === 'success' && tab) tab.location.href = result.message
            else {
              tab?.close()
              setError(result.message || 'Pratinjau belum dapat dibuka.')
            }
          })
        }}
      >
        {pending ? 'Menyiapkan pratinjau…' : 'Pratinjau perubahan'}
      </AdminButton>
      <p className={s.muted}>Pratinjau berlaku 10 menit dan tidak mengubah situs.</p>
      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
