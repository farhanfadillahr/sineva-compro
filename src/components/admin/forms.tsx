'use client'
import { useId, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { validateCopyField } from '@/lib/copy/dash-rule'
import s from './admin.module.css'
export function ContentField({
  label,
  name,
  limit,
  defaultValue = '',
  hint,
  publicCopy = true,
  required = false,
}: {
  label: string
  name: string
  limit: number
  defaultValue?: string
  hint?: string
  publicCopy?: boolean
  required?: boolean
}) {
  const id = useId()
  const [value, setValue] = useState(defaultValue)
  const input = useRef<HTMLInputElement>(null)
  const length = Array.from(value).length
  const copy = publicCopy ? validateCopyField(value) : { ok: true as const }
  const error = length > limit ? `Maksimal ${limit} karakter.` : !copy.ok ? copy.message : ''
  function update(next: string) {
    setValue(next)
    const c = publicCopy ? validateCopyField(next) : { ok: true as const }
    input.current?.setCustomValidity(
      Array.from(next).length > limit ? `Maksimal ${limit} karakter.` : !c.ok ? c.message : '',
    )
  }
  return (
    <div className={s.field}>
      <label htmlFor={id}>{label}</label>
      <input
        ref={(el) => {
          input.current = el
          el?.setCustomValidity(error)
        }}
        id={id}
        name={name}
        value={value}
        required={required}
        onChange={(e) => update(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={`${id}-hint ${id}-count${error ? ` ${id}-error` : ''}`}
      />
      <div className={s.counter}>
        <span id={`${id}-hint`} className={s.muted}>
          {hint}
        </span>
        <output
          id={`${id}-count`}
          className={length > limit ? s.error : length >= limit * 0.9 ? s.warning : s.mono}
          aria-live="polite"
        >
          {length}/{limit}
        </output>
      </div>
      {error ? (
        <p id={`${id}-error`} className={s.error} role="alert">
          {error}
        </p>
      ) : null}
      {!copy.ok ? (
        <button type="button" className={s.button} onClick={() => update(copy.fix)}>
          Ganti tanda baca
        </button>
      ) : null}
    </div>
  )
}
export type LocaleOption = { code: string; label: string; complete: boolean }
export function LocaleTabs({
  locales,
  value,
  onChange,
  renderPanel,
}: {
  locales: LocaleOption[]
  value: string
  onChange: (code: string) => void
  renderPanel?: (code: string) => ReactNode
}) {
  const id = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  if (locales.length < 2)
    return renderPanel ? <>{locales[0] ? renderPanel(locales[0].code) : null}</> : null
  return (
    <>
      <div className={s.tabs} role="tablist" aria-label="Bahasa konten">
        {locales.map((l, i) => (
          <button
            ref={(el) => {
              refs.current[i] = el
            }}
            id={`${id}-${l.code}`}
            key={l.code}
            className={s.tab}
            type="button"
            role="tab"
            aria-label={`${l.label}, ${l.complete ? 'Lengkap' : 'Belum lengkap'}`}
            aria-selected={value === l.code}
            aria-controls={renderPanel ? `${id}-panel-${l.code}` : undefined}
            tabIndex={value === l.code ? 0 : -1}
            onClick={() => onChange(l.code)}
            onKeyDown={(e) => {
              let next = i
              if (e.key === 'ArrowRight') next = (i + 1) % locales.length
              else if (e.key === 'ArrowLeft') next = (i + locales.length - 1) % locales.length
              else if (e.key === 'Home') next = 0
              else if (e.key === 'End') next = locales.length - 1
              else return
              e.preventDefault()
              onChange(locales[next].code)
              refs.current[next]?.focus()
            }}
          >
            {l.label}
            <span aria-hidden className={s.dot} />
          </button>
        ))}
      </div>
      {renderPanel
        ? locales.map((l) => (
            <div
              key={l.code}
              role="tabpanel"
              id={`${id}-panel-${l.code}`}
              aria-labelledby={`${id}-${l.code}`}
              hidden={value !== l.code}
            >
              {renderPanel(l.code)}
            </div>
          ))
        : null}
    </>
  )
}
function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
export function SlugInput({
  title,
  prefix,
  name,
  defaultValue,
  publishedSlug,
}: {
  title: string
  prefix: string
  name: string
  defaultValue?: string
  publishedSlug?: string
}) {
  const id = useId()
  const [edited, setEdited] = useState(defaultValue)
  const value = edited ?? slugify(title)
  return (
    <div className={s.field}>
      <label htmlFor={id}>Slug</label>
      <div className={s.row}>
        <span className={s.mono}>{prefix}</span>
        <input
          id={id}
          name={name}
          value={value}
          onChange={(e) => setEdited(e.target.value)}
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          aria-describedby={`${id}-hint`}
        />
      </div>
      <p id={`${id}-hint`} className={s.muted}>
        Gunakan huruf kecil, angka, dan tanda hubung.
      </p>
      {publishedSlug && value !== publishedSlug ? (
        <p role="status" className={s.warning}>
          Redirect 301 akan dibuat
        </p>
      ) : null}
    </div>
  )
}
export function SecretField({
  name,
  label,
  configured = false,
  managedByEnvironment = false,
}: {
  name: string
  label: string
  configured?: boolean
  managedByEnvironment?: boolean
}) {
  const id = useId()
  return (
    <div className={s.field}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type="password"
        autoComplete="new-password"
        defaultValue=""
        disabled={managedByEnvironment}
        placeholder={
          configured ? 'Tersimpan. Kosongkan untuk mempertahankan.' : 'Masukkan rahasia baru'
        }
        aria-describedby={`${id}-hint`}
      />
      <p id={`${id}-hint`} role="status" className={s.muted}>
        {managedByEnvironment
          ? 'Diatur oleh environment.'
          : configured
            ? 'Nilai tersimpan tidak ditampilkan. Isi hanya untuk mengganti.'
            : 'Nilai hanya ditulis, tidak ditampilkan kembali.'}
      </p>
    </div>
  )
}
export type SelectOption = { value: string; label: string }
export function MultiSelect({
  label,
  name,
  options,
  value,
  onChange,
  multiple = true,
  onCreate,
}: {
  label: string
  name?: string
  options: SelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  multiple?: boolean
  onCreate?: (label: string) => void
}) {
  const id = useId()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const input = useRef<HTMLInputElement>(null)
  const filtered = options.filter(
    (o) =>
      !value.includes(o.value) &&
      o.label.toLocaleLowerCase('id').includes(search.toLocaleLowerCase('id')),
  )
  function select(option: SelectOption) {
    onChange(multiple ? [...value, option.value] : [option.value])
    setSearch('')
    setActive(-1)
    setOpen(false)
    input.current?.focus()
  }
  return (
    <div
      className={`${s.field} ${s.popupAnchor}`}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false)
      }}
    >
      <label htmlFor={id}>{label}</label>
      <div className={s.row}>
        {value.map((v) => (
          <span className={s.chip} key={v}>
            {options.find((o) => o.value === v)?.label ?? v}
            <button
              type="button"
              className={`${s.button} ${s.iconButton}`}
              aria-label={`Hapus ${options.find((o) => o.value === v)?.label ?? v}`}
              onClick={() => onChange(value.filter((x) => x !== v))}
            >
              ×
            </button>
            {name ? <input type="hidden" name={name} value={v} /> : null}
          </span>
        ))}
      </div>
      <input
        ref={input}
        id={id}
        role="combobox"
        autoComplete="off"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={open && active >= 0 ? `${id}-option-${active}` : undefined}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setActive(-1)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setOpen(true)
            setActive((i) => Math.min(i + 1, filtered.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((i) => Math.max(0, i - 1))
          } else if (e.key === 'Enter' && open) {
            e.preventDefault()
            if (filtered[active]) select(filtered[active])
            else if (onCreate && search.trim() && !filtered.length) {
              onCreate(search.trim())
              setSearch('')
              setOpen(false)
            }
          } else if (e.key === 'Escape') {
            e.preventDefault()
            setOpen(false)
          } else if (e.key === 'Backspace' && !search && multiple && value.length)
            onChange(value.slice(0, -1))
        }}
      />
      {open ? (
        <ul
          id={`${id}-list`}
          className={s.popup}
          role="listbox"
          aria-label={label}
          aria-multiselectable={multiple}
        >
          {filtered.map((o, i) => (
            <li
              key={o.value}
              role="option"
              id={`${id}-option-${i}`}
              aria-selected={i === active}
              className={s.option}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(o)}
            >
              {o.label}
            </li>
          ))}
          {!filtered.length ? (
            <li role="presentation">
              {onCreate && search.trim() ? (
                <button
                  type="button"
                  className={s.button}
                  onClick={() => {
                    onCreate(search.trim())
                    setSearch('')
                    setOpen(false)
                  }}
                >
                  Buat {search.trim()}
                </button>
              ) : (
                'Tidak ada pilihan.'
              )}
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  )
}
export function Toggle({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={s.switch}>
      <input {...props} type="checkbox" role="switch" />
      {label}
    </label>
  )
}
export function RadioCards({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string
  name: string
  options: SelectOption[]
  defaultValue?: string
}) {
  return (
    <fieldset className={s.cards}>
      <legend>{label}</legend>
      {options.map((o) => (
        <label key={o.value} className={s.radioCard}>
          <input
            type="radio"
            name={name}
            value={o.value}
            defaultChecked={defaultValue === o.value}
          />
          {o.label}
        </label>
      ))}
    </fieldset>
  )
}
export function ChoicePicker({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string
  name: string
  options: (SelectOption & { preview: ReactNode })[]
  defaultValue?: string
}) {
  return (
    <fieldset className={s.cards}>
      <legend>{label}</legend>
      {options.map((o) => (
        <label key={o.value} className={s.radioCard}>
          <input
            type="radio"
            aria-label={o.label}
            name={name}
            value={o.value}
            defaultChecked={o.value === defaultValue}
          />
          <span aria-hidden>{o.preview}</span>
          {o.label}
        </label>
      ))}
    </fieldset>
  )
}
