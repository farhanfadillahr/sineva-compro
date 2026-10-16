'use client'
import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { Badge, AdminButton } from '@/components/admin/primitives'
import { EmptyState } from '@/components/admin/display'
import { InlineBanner } from '@/components/admin/feedback'
import { SectionHeader } from '@/components/admin/shell'
import { idleState } from '../../cms/errors'
import type { CmsAction } from '@/components/admin/cms/cms-form'
import s from '@/components/admin/admin.module.css'

export type ListRow = {
  id: string
  key: string
  title: string
  isDemo: boolean
  meta?: string
  status?: { label: string; tone: 'success' | 'warning' | 'brand' | 'danger' }
}

/** Ordered collection table: edit links, move up/down and one "save order" submit. */
export function CollectionList({
  reorder,
  title,
  description,
  rows,
  basePath,
  itemLabel,
  orderable = true,
  keyLabel = 'Kunci',
}: {
  /** Action that saves the order, with the hidden fields it needs (for example the collection). */
  reorder: { action: CmsAction; fields: Readonly<Record<string, string>> }
  title: string
  description: string
  rows: ListRow[]
  basePath: string
  itemLabel: string
  orderable?: boolean
  keyLabel?: string
}) {
  const router = useRouter()
  const [order, setOrder] = useState(rows)
  const [state, submit, pending] = useActionState(reorder.action, idleState)
  const dirty = order.some((row, i) => row.id !== rows[i]?.id)
  useEffect(() => {
    if (state.status === 'success') router.refresh()
  }, [state, router])
  const move = (index: number, by: number) => {
    const next = [...order]
    const target = index + by
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setOrder(next)
  }
  return (
    <section className={s.stack} aria-label={title}>
      <SectionHeader
        title={title}
        helper={description}
        action={
          <Link className={`${s.button} ${s.primary}`} href={`${basePath}/new`}>
            Tambah {itemLabel.toLowerCase()}
          </Link>
        }
      />
      {state.status === 'error' ? <InlineBanner tone="error">{state.message}</InlineBanner> : null}
      {order.length === 0 ? (
        <EmptyState message={`Belum ada ${itemLabel.toLowerCase()}.`} />
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                {orderable ? <th scope="col">Urutan</th> : null}
                <th scope="col">{itemLabel}</th>
                <th scope="col">{keyLabel}</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {order.map((row, index) => (
                <tr key={row.id}>
                  {orderable ? (
                    <td>
                      <div className={s.row}>
                        <button
                          type="button"
                          className={s.button}
                          aria-label={`Naikkan ${row.title}`}
                          disabled={index === 0}
                          onClick={() => move(index, -1)}
                        >
                          <ArrowUp size={14} aria-hidden />
                        </button>
                        <button
                          type="button"
                          className={s.button}
                          aria-label={`Turunkan ${row.title}`}
                          disabled={index === order.length - 1}
                          onClick={() => move(index, 1)}
                        >
                          <ArrowDown size={14} aria-hidden />
                        </button>
                      </div>
                    </td>
                  ) : null}
                  <td>
                    <Link href={`${basePath}/${row.id}`}>{row.title}</Link>{' '}
                    {row.isDemo ? <Badge tone="warning">Demo</Badge> : null}
                    {row.meta ? <span className={s.muted}> · {row.meta}</span> : null}
                  </td>
                  <td className={s.mono}>{row.key}</td>
                  <td>
                    {row.status ? (
                      <Badge tone={row.status.tone}>{row.status.label}</Badge>
                    ) : (
                      'Tampil'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {orderable && dirty ? (
        <form action={submit} className={s.row}>
          {Object.entries(reorder.fields).map(([field, value]) => (
            <input key={field} type="hidden" name={field} value={value} />
          ))}
          <input type="hidden" name="payload" value={JSON.stringify(order.map((r) => r.id))} />
          <AdminButton tone="primary" type="submit" disabled={pending}>
            {pending ? 'Menyimpan urutan…' : 'Simpan urutan'}
          </AdminButton>
          <AdminButton onClick={() => setOrder(rows)}>Batalkan</AdminButton>
        </form>
      ) : null}
    </section>
  )
}
