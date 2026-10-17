'use client'
import { useEffect, useLayoutEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, X } from 'lucide-react'
import s from './admin.module.css'
type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  confirmName?: string
  onConfirm?: () => void
  confirmLabel?: string
}
export function Dialog(props: DialogProps) {
  return props.open ? <Modal {...props} /> : null
}
export function Drawer(props: Omit<DialogProps, 'confirmName' | 'onConfirm'>) {
  return props.open ? <Modal {...props} drawer /> : null
}
function Modal({
  onClose,
  title,
  children,
  confirmName,
  onConfirm,
  confirmLabel = 'Konfirmasi',
  drawer = false,
}: DialogProps & { drawer?: boolean }) {
  const id = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const [typed, setTyped] = useState('')
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const el = dialog.current
    if (el && !el.open) el.showModal()
    el?.querySelector<HTMLElement>('button,input,[tabindex="0"]')?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      el?.close()
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [])
  return (
    <dialog
      ref={dialog}
      className={`${s.dialog} ${drawer ? s.drawer : ''}`}
      aria-labelledby={`${id}-title`}
      aria-modal="true"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect()
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose()
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          e.stopPropagation()
          onClose()
          return
        }
        if (e.key !== 'Tab') return
        const items = Array.from(
          e.currentTarget.querySelectorAll<HTMLElement>(
            'a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
          ),
        ).filter((el) => !el.hidden)
        const first = items[0],
          last = items.at(-1)
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }}
    >
      <div className={s.dialogHead}>
        <h2 id={`${id}-title`}>{title}</h2>
        <button
          className={`${s.button} ${s.iconButton}`}
          type="button"
          aria-label="Tutup"
          onClick={onClose}
        >
          <X size={16} aria-hidden />
        </button>
      </div>
      {children}
      {confirmName ? (
        <div className={s.field}>
          <label htmlFor={`${id}-confirm`}>Ketik {confirmName} untuk melanjutkan</label>
          <input
            id={`${id}-confirm`}
            autoComplete="off"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
        </div>
      ) : null}
      {onConfirm ? (
        <div className={s.dialogFooter}>
          <button type="button" className={s.button} onClick={onClose}>
            Batal
          </button>
          <button
            type="button"
            className={`${s.button} ${confirmName ? s.danger : s.primary}`}
            disabled={!!confirmName && typed !== confirmName}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      ) : null}
    </dialog>
  )
}
export type MenuItem = {
  label: string
  href?: string
  onSelect?: () => void
  danger?: boolean
  icon?: ReactNode
}
export function DropdownMenu({
  label,
  items,
  children,
  footer,
  triggerClassName,
}: {
  label: string
  items: MenuItem[]
  children?: ReactNode
  footer?: ReactNode
  triggerClassName?: string
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const container = useRef<HTMLDivElement>(null)
  function close() {
    setOpen(false)
    trigger.current?.focus()
  }
  useEffect(() => {
    if (!open) return
    menu.current?.querySelector<HTMLElement>('[role=menuitem]')?.focus()
    function outside(e: PointerEvent) {
      if (!container.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])
  return (
    <div ref={container} className={s.popupAnchor}>
      <button
        ref={trigger}
        className={`${s.button} ${triggerClassName ?? ''}`}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            setOpen(true)
          }
        }}
      >
        {children ?? label}
        <ChevronDown className={s.menuChevron} size={16} aria-hidden />
      </button>
      {open ? (
        <div
          id={id}
          ref={menu}
          className={s.popup}
          role="menu"
          aria-label={label}
          onKeyDown={(e) => {
            const options = Array.from(
              e.currentTarget.querySelectorAll<HTMLElement>('[role=menuitem],button:not([role])'),
            )
            const index = options.indexOf(document.activeElement as HTMLElement)
            let next = index
            if (e.key === 'Escape') {
              e.preventDefault()
              close()
              return
            }
            if (e.key === 'ArrowDown') next = (index + 1) % options.length
            else if (e.key === 'ArrowUp') next = (index + options.length - 1) % options.length
            else if (e.key === 'Home') next = 0
            else if (e.key === 'End') next = options.length - 1
            else if (e.key === 'Tab') {
              setOpen(false)
              return
            } else return
            e.preventDefault()
            options[next]?.focus()
          }}
        >
          {items.map((item) =>
            item.href ? (
              <a key={item.label} role="menuitem" tabIndex={-1} href={item.href} onClick={close}>
                {item.icon}
                {item.label}
              </a>
            ) : (
              <button
                key={item.label}
                role="menuitem"
                type="button"
                tabIndex={-1}
                className={item.danger ? s.danger : undefined}
                onClick={() => {
                  close()
                  item.onSelect?.()
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ),
          )}
          {footer ? (
            <div className={s.menuFooter} role="none">
              {footer}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/** Non-modal contextual content; Tab can leave and outside clicks dismiss it. */
export function Popover({
  label,
  title,
  children,
}: {
  label: string
  title: string
  children: ReactNode
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const popup = useRef<HTMLDivElement>(null)
  const container = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (!open || !popup.current || !trigger.current) return
    const element = popup.current
    const button = trigger.current
    const position = () => {
      const origin = button.getBoundingClientRect()
      const bounds = element.getBoundingClientRect()
      const left = Math.max(8, Math.min(origin.left, window.innerWidth - bounds.width - 8))
      const below = origin.bottom + 8
      const top =
        below + bounds.height <= window.innerHeight - 8
          ? below
          : Math.max(8, origin.top - bounds.height - 8)
      element.style.left = `${left}px`
      element.style.top = `${top}px`
    }
    position()
    ;(
      element.querySelector<HTMLElement>(
        'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
      ) ?? element
    ).focus()
    const outside = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    window.addEventListener('resize', position)
    window.addEventListener('scroll', position, { capture: true, passive: true })
    return () => {
      document.removeEventListener('pointerdown', outside)
      window.removeEventListener('resize', position)
      window.removeEventListener('scroll', position, true)
    }
  }, [open])
  return (
    <div
      ref={container}
      className={s.popupAnchor}
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget))
          setOpen(false)
      }}
      onKeyDown={(event) => {
        if (open && event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          setOpen(false)
          trigger.current?.focus()
        }
      }}
    >
      <button
        ref={trigger}
        className={s.button}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        {label}
      </button>
      {open ? (
        <div
          ref={popup}
          id={id}
          className={`${s.popup} ${s.popover}`}
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${id}-title`}
          tabIndex={-1}
        >
          <h2 id={`${id}-title`}>{title}</h2>
          {children}
          <button
            className={s.button}
            type="button"
            onClick={() => {
              setOpen(false)
              trigger.current?.focus()
            }}
          >
            Tutup panduan
          </button>
        </div>
      ) : null}
    </div>
  )
}
