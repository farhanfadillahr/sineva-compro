import type { ComponentProps } from 'react'
import { cx } from './cx'
import { fieldControlClasses } from './field-styles'

type SelectProps = ComponentProps<'select'> & {
  // Classes for the positioning wrapper. `className` goes to the <select> itself.
  wrapperClassName?: string
}

// Native <select> (no custom listbox in v1, so the platform picker, keyboard and screen reader
// behaviour come for free). `appearance-none` removes the OS arrow, which is redrawn as a
// decorative chevron; `pr-11` keeps long option text from running underneath it.
export function Select({ className, wrapperClassName, children, ...rest }: SelectProps) {
  return (
    <div className={cx('relative w-full', wrapperClassName)}>
      <select
        {...rest}
        className={cx(
          fieldControlClasses,
          'h-12 cursor-pointer appearance-none py-3 pr-11',
          className,
        )}
      >
        {children}
      </select>
      <svg
        data-slot="chevron"
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-text-secondary"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  )
}
