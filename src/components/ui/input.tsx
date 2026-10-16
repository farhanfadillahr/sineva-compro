import type { ComponentProps } from 'react'
import { cx } from './cx'
import { fieldControlClasses } from './field-styles'

type InputProps = ComponentProps<'input'>

// Bare control. Wrap it in <Field> for the label, helper and error wiring; without a Field it needs
// its own accessible name (aria-label or an associated <label>).
export function Input({ type = 'text', className, ...rest }: InputProps) {
  return <input {...rest} type={type} className={cx(fieldControlClasses, 'h-12 py-3', className)} />
}
