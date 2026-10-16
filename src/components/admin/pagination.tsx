'use client'
import { useId } from 'react'
import { tableUrl } from './table-state'
import s from './admin.module.css'
export type PaginationProps = {
  total: number
  page: number
  pageSize: number
  pathname: string
  query: string
  onNavigate?: (url: string) => void
  pageSizes?: readonly number[]
}
export function Pagination({
  total,
  page,
  pageSize,
  pathname,
  query,
  onNavigate,
  pageSizes = [20, 50, 100],
}: PaginationProps) {
  const id = useId()
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const current = new URLSearchParams(query)
  const nearby = [
    ...new Set([1, ...[page - 1, page, page + 1].filter((n) => n > 1 && n < pages), pages]),
  ].sort((a, b) => a - b)
  const url = (p: number) => tableUrl(pathname, current, { page: p })
  function link(p: number, label: string, text: string) {
    return (
      <a
        className={`${s.button} ${s.pageButton}`}
        aria-label={label}
        aria-current={label === `Halaman ${page}` ? 'page' : undefined}
        href={url(p)}
        onClick={
          onNavigate
            ? (e) => {
                e.preventDefault()
                onNavigate(url(p))
              }
            : undefined
        }
      >
        {text}
      </a>
    )
  }
  return (
    <nav className={s.pagination} aria-label="Navigasi halaman tabel">
      <span className={s.mono}>
        Menampilkan {total ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, total)} dari{' '}
        {total}
      </span>
      <label htmlFor={id} className={s.row}>
        Baris per halaman
        <select
          id={id}
          value={pageSize}
          onChange={(e) => {
            const next = tableUrl(pathname, current, { page: 1, pageSize: Number(e.target.value) })
            if (onNavigate) onNavigate(next)
            else window.location.assign(next)
          }}
        >
          {pageSizes.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <div className={s.pageButtons}>
        {page > 1 ? (
          <>
            {link(1, 'Halaman pertama', '«')}
            {link(page - 1, 'Halaman sebelumnya', '‹')}
          </>
        ) : null}
        {nearby.map((n, i) => (
          <span key={n} className={s.row}>
            {i > 0 && n - nearby[i - 1] > 1 ? <span aria-hidden>…</span> : null}
            {link(n, `Halaman ${n}`, String(n))}
          </span>
        ))}
        {page < pages ? (
          <>
            {link(page + 1, 'Halaman berikutnya', '›')}
            {link(pages, 'Halaman terakhir', '»')}
          </>
        ) : null}
      </div>
    </nav>
  )
}
