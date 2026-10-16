'use client'
import { useId, type ReactNode } from 'react'
import type { JSONContent } from '@tiptap/core'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { validateCopyField } from '@/lib/copy/dash-rule'
import {
  emptyValue,
  type FieldErrors,
  type FieldSchema,
  type MediaValue,
  type ObjectField,
  type TextField,
} from '@/features/cms/fields'
import { RichTextEditor } from '../rich-text-editor'
import { AdminButton } from '../primitives'
import { MediaValueField } from './media-value-field'
import s from '../admin.module.css'
import c from './cms.module.css'

export type Extras = Readonly<Record<string, (value: unknown) => ReactNode>>

type Props = {
  schema: FieldSchema
  value: unknown
  onChange: (value: unknown) => void
  path: string
  errors: FieldErrors
  isAdmin: boolean
  /** Content rendered after the field at that path, for previews such as the wa.me link. */
  extras?: Extras
  /** Field key hidden inside list items (shown as the item title instead). */
  hideKey?: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function TextInput({
  schema,
  value,
  onChange,
  error,
}: {
  schema: TextField
  value: string
  onChange: (value: string | null) => void
  error?: string
}) {
  const id = useId()
  const length = Array.from(value).length
  const copy = schema.publicCopy === false ? ({ ok: true } as const) : validateCopyField(value)
  const local =
    length > schema.max ? `Maksimal ${schema.max} karakter.` : !copy.ok ? copy.message : ''
  const shown = local || error
  const describedBy = `${id}-count${schema.hint ? ` ${id}-hint` : ''}${shown ? ` ${id}-error` : ''}`
  const set = (next: string) => onChange(next === '' && schema.nullable ? null : next)
  return (
    <div className={s.field}>
      <label htmlFor={id}>
        {schema.label}
        {schema.required ? <span aria-hidden> *</span> : null}
      </label>
      {schema.multiline ? (
        <textarea
          id={id}
          rows={3}
          value={value}
          required={schema.required}
          aria-invalid={!!shown}
          aria-describedby={describedBy}
          onChange={(event) => set(event.target.value)}
        />
      ) : (
        <input
          id={id}
          value={value}
          required={schema.required}
          inputMode={schema.format === 'e164' ? 'tel' : undefined}
          type={schema.format === 'email' ? 'email' : schema.format === 'url' ? 'url' : 'text'}
          aria-invalid={!!shown}
          aria-describedby={describedBy}
          onChange={(event) => set(event.target.value)}
        />
      )}
      <div className={s.counter}>
        <span id={`${id}-hint`} className={s.muted}>
          {schema.hint}
        </span>
        <output
          id={`${id}-count`}
          className={
            length > schema.max ? s.error : length >= schema.max * 0.9 ? s.warning : s.mono
          }
          aria-live="polite"
        >
          {length}/{schema.max}
        </output>
      </div>
      {shown ? (
        <p id={`${id}-error`} className={s.error} role="alert">
          {shown}
        </p>
      ) : null}
      {!copy.ok ? (
        <button type="button" className={s.button} onClick={() => set(copy.fix)}>
          Ganti tanda baca
        </button>
      ) : null}
    </div>
  )
}

function itemTitle(schema: FieldSchema, item: unknown, index: number, label: string, key?: string) {
  if (key && isRecord(item) && typeof item[key] === 'string' && item[key]) return String(item[key])
  if (schema.kind === 'object' && isRecord(item)) {
    const first = Object.entries(schema.fields).find(
      ([k, field]) => field.kind === 'text' && typeof item[k] === 'string' && item[k],
    )
    if (first) {
      const text = String(item[first[0]])
      return text.length > 60 ? `${text.slice(0, 57)}…` : text
    }
  }
  if (typeof item === 'string' && item) return item.length > 60 ? `${item.slice(0, 57)}…` : item
  return `${label} ${index + 1}`
}

/** Renders any field descriptor as a controlled input. Paths match the server's error keys. */
export function SchemaField(props: Props): ReactNode {
  const { schema, value, onChange, path, errors, extras } = props
  if ('adminOnly' in schema && schema.adminOnly && !props.isAdmin) return null
  const error = errors[path]
  const extra = extras?.[path]?.(value)
  let control: ReactNode
  switch (schema.kind) {
    case 'text':
      control = (
        <TextInput
          schema={schema}
          value={typeof value === 'string' ? value : ''}
          onChange={onChange}
          error={error}
        />
      )
      break
    case 'boolean':
      control = (
        <div className={s.field}>
          <label className={s.switch}>
            <input
              type="checkbox"
              role="switch"
              checked={value === true}
              onChange={(event) => onChange(event.target.checked)}
            />
            {schema.label}
          </label>
          {schema.hint ? <p className={s.muted}>{schema.hint}</p> : null}
          {error ? <p className={s.error}>{error}</p> : null}
        </div>
      )
      break
    case 'select':
      control = <SelectInput {...props} schema={schema} />
      break
    case 'media':
      control = (
        <MediaValueField
          label={schema.label}
          hint={schema.hint}
          value={(value as MediaValue) ?? null}
          error={error}
          onChange={onChange}
        />
      )
      break
    case 'richText':
      control = (
        <div className={s.field}>
          <RichTextEditor
            label={schema.label}
            name={path}
            defaultValue={(isRecord(value) ? value : undefined) as JSONContent | undefined}
            onChange={(next) => onChange(next)}
          />
          {schema.hint ? <p className={s.muted}>{schema.hint}</p> : null}
          {error ? (
            <p className={s.error} role="alert">
              {error}
            </p>
          ) : null}
        </div>
      )
      break
    case 'list':
      control = <ListInput {...props} schema={schema} />
      break
    case 'object':
      control = <ObjectInput {...props} schema={schema} />
      break
  }
  return (
    <>
      {control}
      {extra}
    </>
  )
}

function SelectInput(props: Props & { schema: Extract<FieldSchema, { kind: 'select' }> }) {
  const id = useId()
  const { schema, value, onChange, errors, path } = props
  return (
    <div className={s.field}>
      <label htmlFor={id}>{schema.label}</label>
      <select
        id={id}
        value={typeof value === 'string' ? value : ''}
        aria-invalid={!!errors[path]}
        onChange={(event) =>
          onChange(event.target.value === '' && schema.nullable ? null : event.target.value)
        }
      >
        {schema.nullable ? <option value="">Tidak ada</option> : null}
        {schema.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {schema.hint ? <p className={s.muted}>{schema.hint}</p> : null}
      {errors[path] ? <p className={s.error}>{errors[path]}</p> : null}
    </div>
  )
}

function ListInput(props: Props & { schema: Extract<FieldSchema, { kind: 'list' }> }) {
  const { schema, value, onChange, path, errors } = props
  const items = Array.isArray(value) ? value : []
  const label = schema.itemLabel ?? 'Item'
  const update = (index: number, next: unknown) =>
    onChange(items.map((item, i) => (i === index ? next : item)))
  const move = (index: number, by: number) => {
    const target = index + by
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }
  return (
    <fieldset className={c.list}>
      <legend>{schema.label}</legend>
      {schema.hint ? <p className={s.muted}>{schema.hint}</p> : null}
      {errors[path] ? (
        <p className={s.error} role="alert">
          {errors[path]}
        </p>
      ) : null}
      {items.length === 0 ? <p className={s.muted}>Belum ada {label.toLowerCase()}.</p> : null}
      <ol className={c.items}>
        {items.map((item, index) => (
          <li key={index} className={c.item}>
            <div className={c.itemHead}>
              <strong>{itemTitle(schema.item, item, index, label, schema.titleKey)}</strong>
              {schema.fixed ? null : (
                <div className={s.row}>
                  <button
                    type="button"
                    className={s.button}
                    aria-label={`Naikkan ${label} ${index + 1}`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp size={14} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={s.button}
                    aria-label={`Turunkan ${label} ${index + 1}`}
                    disabled={index === items.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown size={14} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={`${s.button} ${s.danger}`}
                    aria-label={`Hapus ${label} ${index + 1}`}
                    disabled={items.length <= (schema.min ?? 0)}
                    onClick={() => onChange(items.filter((_, i) => i !== index))}
                  >
                    <Trash2 size={14} aria-hidden />
                  </button>
                </div>
              )}
            </div>
            <SchemaField
              {...props}
              schema={schema.item}
              value={item}
              path={`${path}.${index}`}
              hideKey={schema.fixed ? schema.titleKey : undefined}
              onChange={(next) => update(index, next)}
            />
          </li>
        ))}
      </ol>
      {schema.fixed ? null : (
        <AdminButton
          disabled={items.length >= schema.max}
          onClick={() => onChange([...items, emptyValue(schema.item)])}
        >
          <Plus size={14} aria-hidden /> Tambah {label.toLowerCase()}
        </AdminButton>
      )}
    </fieldset>
  )
}

function ObjectInput(props: Props & { schema: ObjectField }) {
  const { schema, value, onChange, path, isAdmin, hideKey } = props
  if (schema.adminOnly && !isAdmin) return null
  const data = isRecord(value) ? value : {}
  const collapsed = schema.collapsible && data.visible === false
  const entries = Object.entries(schema.fields).filter(
    ([key]) => key !== hideKey && !(schema.collapsible && key === 'visible'),
  )
  const body = (
    <>
      {schema.collapsible ? (
        <label className={s.switch}>
          <input
            type="checkbox"
            role="switch"
            checked={data.visible !== false}
            onChange={(event) => onChange({ ...data, visible: event.target.checked })}
          />
          Tampilkan bagian ini
        </label>
      ) : null}
      {collapsed
        ? null
        : entries.map(([key, field]) => (
            <SchemaField
              key={key}
              {...props}
              hideKey={undefined}
              schema={field}
              value={data[key]}
              path={path ? `${path}.${key}` : key}
              onChange={(next) => onChange({ ...data, [key]: next })}
            />
          ))}
    </>
  )
  if (!schema.label) return <div className={s.stack}>{body}</div>
  return (
    <fieldset className={c.group}>
      <legend>
        {schema.label}
        {schema.adminOnly ? <span className={c.adminTag}>Admin</span> : null}
      </legend>
      {schema.hint ? <p className={s.muted}>{schema.hint}</p> : null}
      {props.errors[path] ? <p className={s.error}>{props.errors[path]}</p> : null}
      {body}
    </fieldset>
  )
}
