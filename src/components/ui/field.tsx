import { useId, type ReactNode } from 'react'
import { cx } from './cx'

// What a control needs from its Field. Spread it onto Input, Textarea or Select.
export type FieldControlProps = {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: true
  'aria-required'?: true
}

type FieldProps = {
  label: ReactNode
  helper?: ReactNode
  // An error string turns the control invalid and shows the message under it.
  error?: ReactNode
  required?: boolean
  // The word for "required" (for example "(required)"), supplied by the caller from messages.
  requiredLabel?: string
  // components.md section 6: the marker may be hidden visually only when every field is required.
  // Screen readers always get it, and aria-required stays set either way.
  requiredVisible?: boolean
  // Stable id for server-rendered forms that also reference the control from an error summary.
  id?: string
  className?: string
  children: (control: FieldControlProps) => ReactNode
}

export function fieldMessageIds(id: string) {
  return { helperId: `${id}-helper`, errorId: `${id}-error` }
}

export function FieldHelper({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} data-slot="helper" className="text-micro text-text-tertiary">
      {children}
    </p>
  )
}

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} data-slot="error" className="flex items-start gap-1.5 text-micro text-danger">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-px size-4 shrink-0"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5" />
        <path d="M12 16.5h.01" />
      </svg>
      <span>{children}</span>
    </p>
  )
}

// Label above the control, optional helper and error below, all linked: `for`/`id` for the label,
// `aria-describedby` for helper and error (helper first), `aria-invalid` only while there is an
// error. The control is a render prop so the wiring cannot be forgotten or mismatched.
//
//   <Field label={t('email')} error={errors.email}>
//     {(control) => <Input type="email" {...control} />}
//   </Field>
export function Field({
  label,
  helper,
  error,
  required = false,
  requiredLabel,
  requiredVisible = true,
  id,
  className,
  children,
}: FieldProps) {
  const generatedId = useId()
  const controlId = id ?? generatedId
  const { helperId, errorId } = fieldMessageIds(controlId)
  const hasHelper = helper !== undefined && helper !== null && helper !== false
  const hasError = error !== undefined && error !== null && error !== false
  const describedBy = [hasHelper ? helperId : null, hasError ? errorId : null]
    .filter(Boolean)
    .join(' ')

  const control: FieldControlProps = { id: controlId }
  if (describedBy) control['aria-describedby'] = describedBy
  if (hasError) control['aria-invalid'] = true
  if (required) control['aria-required'] = true

  return (
    <div className={cx('flex flex-col gap-2', className)}>
      <label htmlFor={controlId} className="text-label text-text">
        {label}
        {required && requiredLabel ? (
          <span className={cx('ml-1 text-text-secondary', !requiredVisible && 'sr-only')}>
            {requiredLabel}
          </span>
        ) : null}
      </label>
      {children(control)}
      {hasHelper ? <FieldHelper id={helperId}>{helper}</FieldHelper> : null}
      {hasError ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  )
}
