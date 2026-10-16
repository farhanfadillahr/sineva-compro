import type { ComponentProps } from 'react'
import { cx } from './cx'
import { fieldControlClasses } from './field-styles'

type TextareaProps = ComponentProps<'textarea'>

export function Textarea({ className, ...rest }: TextareaProps) {
  return (
    <textarea {...rest} className={cx(fieldControlClasses, 'min-h-32 resize-y py-3', className)} />
  )
}
