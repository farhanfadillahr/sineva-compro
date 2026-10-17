'use client'
import { useId, useRef, useState, type ReactNode } from 'react'
import s from './admin.module.css'
export function Avatar({ name, size = 32 }: { name: string; size?: 24 | 32 | 40 }) {
  return (
    <span className={s.avatar} style={{ width: size, height: size }} role="img" aria-label={name}>
      {name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((n) => Array.from(n)[0])
        .join('')
        .toUpperCase()}
    </span>
  )
}
export function StatCard({
  label,
  value,
  delta,
  href,
  children,
}: {
  label: string
  value: number | string
  delta?: string
  href?: string
  children?: ReactNode
}) {
  const content = (
    <>
      <span className={s.muted}>{label}</span>
      <div className={s.kpi}>{value}</div>
      {delta ? <span className={s.badge}>{delta}</span> : null}
      {children}
    </>
  )
  return href ? (
    <a className={s.panel} href={href}>
      {content}
    </a>
  ) : (
    <div className={s.panel}>{content}</div>
  )
}
export function ListCard({
  title,
  href,
  items,
}: {
  title: string
  href?: string
  items: { id: string; title: string; href?: string; meta?: string; trailing?: ReactNode }[]
}) {
  return (
    <section className={s.panel}>
      <div className={s.sectionHeader}>
        <h2>{title}</h2>
        {href ? <a href={href}>Lihat semua</a> : null}
      </div>
      <ul className={s.list}>
        {items.map((i) => (
          <li key={i.id} className={s.row}>
            <div>
              {i.href ? <a href={i.href}>{i.title}</a> : i.title}
              {i.meta ? <p className={s.muted}>{i.meta}</p> : null}
            </div>
            {i.trailing}
          </li>
        ))}
      </ul>
    </section>
  )
}
export function ActivityFeed({
  items,
}: {
  items: { id: string; actor: string; action: string; date: string }[]
}) {
  return (
    <ol className={s.list} aria-label="Aktivitas terbaru">
      {items.map((i) => (
        <li key={i.id} className={s.row}>
          <Avatar name={i.actor} size={24} />
          <span>
            {i.actor} {i.action}
          </span>
          <time dateTime={i.date} className={`${s.muted} ${s.mono}`}>
            {new Intl.DateTimeFormat('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short',
              timeZone: 'Asia/Jakarta',
            }).format(new Date(i.date))}
          </time>
        </li>
      ))}
    </ol>
  )
}
export function CompletenessCard({
  locales,
}: {
  locales: { code: string; percent: number; missing: { label: string; href: string }[] }[]
}) {
  return (
    <section className={`${s.panel} ${s.stack}`} aria-label="Kelengkapan konten">
      {locales.map((l) => (
        <div key={l.code}>
          <label className={s.row}>
            {l.code.toUpperCase()} {l.percent}%
            <progress
              aria-label={l.code.toUpperCase()}
              className={s.progress}
              max={100}
              value={Math.min(100, Math.max(0, l.percent))}
            />
          </label>
          <ul>
            {l.missing.map((i) => (
              <li key={i.href}>
                <a href={i.href}>{i.label}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
export function DescriptionList({
  items,
}: {
  items: { label: string; value: ReactNode; copyValue?: string }[]
}) {
  const [copied, setCopied] = useState('')
  return (
    <>
      <dl className={s.description}>
        {items.map((i) => (
          <div key={i.label} style={{ display: 'contents' }}>
            <dt>{i.label}</dt>
            <dd>
              {i.value}
              {i.copyValue ? (
                <button
                  className={s.button}
                  type="button"
                  aria-label={`Salin ${i.label}`}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(i.copyValue!)
                      setCopied(`${i.label} disalin`)
                    } catch {
                      setCopied('Tidak dapat menyalin. Pilih teks secara manual.')
                    }
                  }}
                >
                  Salin
                </button>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
      <span role="status" className={s.srOnly}>
        {copied}
      </span>
    </>
  )
}
export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className={s.empty}>
      <p>{message}</p>
      {action}
    </div>
  )
}
export function Skeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label}>
      <span className={s.srOnly}>{label}</span>
      <div className={s.skeleton} />
    </div>
  )
}
export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  function close() {
    clearTimeout(timer.current)
    setOpen(false)
  }
  return (
    <span
      className={s.popupAnchor}
      onMouseEnter={() => {
        timer.current = setTimeout(() => setOpen(true), 400)
      }}
      onMouseLeave={close}
      onFocus={() => setOpen(true)}
      onBlur={close}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          close()
          e.stopPropagation()
        }
      }}
      aria-describedby={open ? id : undefined}
    >
      {children}
      {open ? (
        <span className={s.popup} id={id} role="tooltip">
          {label}
        </span>
      ) : null}
    </span>
  )
}
