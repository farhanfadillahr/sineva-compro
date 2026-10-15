import { useId, type ComponentProps, type ReactNode } from 'react'
import { cx, focusRing } from './cx'
import { FieldError, FieldHelper, fieldMessageIds } from './field'

type CheckboxProps = Omit<ComponentProps<'input'>, 'type' | 'children'> & {
  // The clickable label. Required: a checkbox without visible text is not usable.
  label: ReactNode
  helper?: ReactNode
  error?: ReactNode
}

// 20 px box, 6 px radius, --color-action-primary when checked (components.md section 6). The native
// input is kept (appearance-none, not replaced by a div) so keyboard, form submission, `required`
// and screen reader semantics are the platform's. The white check is a sibling SVG that shows via
// `peer-checked`. The whole row is the label, at least 44 px tall.
export function Checkbox({ label, helper, error, id, className, ...rest }: CheckboxProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const { helperId, errorId } = fieldMessageIds(inputId)
  const hasHelper = helper !== undefined && helper !== null && helper !== false
  const hasError = error !== undefined && error !== null && error !== false
  const describedBy = [hasHelper ? helperId : null, hasError ? errorId : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cx('flex flex-col', className)}>
      <label htmlFor={inputId} className="flex min-h-11 cursor-pointer items-start gap-3 py-2.5">
        <span className="relative mt-px inline-flex size-5 shrink-0">
          <input
            {...rest}
            id={inputId}
            type="checkbox"
            aria-describedby={describedBy || undefined}
            aria-invalid={hasError ? true : undefined}
            className={cx(
              'peer size-5 shrink-0 cursor-pointer appearance-none rounded-xs border border-border-input bg-surface',
              'transition-[background-color,border-color] duration-(--dur-fast) ease-out motion-reduce:transition-none',
              'hover:border-text-secondary',
              'checked:border-action-primary checked:bg-action-primary',
              'aria-[invalid=true]:border-danger',
              'disabled:cursor-not-allowed disabled:opacity-45',
              focusRing,
            )}
          />
          <svg
            data-slot="check"
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute inset-0 m-auto hidden size-3.5 text-text-inverse peer-checked:block"
          >
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </span>
        <span className="text-body-sm text-text">{label}</span>
      </label>
      {hasHelper ? <FieldHelper id={helperId}>{helper}</FieldHelper> : null}
      {hasError ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  )
}
