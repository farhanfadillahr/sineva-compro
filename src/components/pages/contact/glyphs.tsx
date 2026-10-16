import type { ComponentProps } from 'react'
import { cx } from '@/components/ui/cx'

// Decorative: the text beside the glyph carries the meaning, so it is hidden from screen readers.
export function CheckGlyph({ className, ...rest }: ComponentProps<'svg'>) {
  return (
    <svg
      {...rest}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cx('size-4 shrink-0', className)}
    >
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  )
}
