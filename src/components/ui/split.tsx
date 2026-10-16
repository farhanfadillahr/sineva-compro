import type { ComponentProps, ReactNode } from 'react'
import { cx } from './cx'

type SplitProps = Omit<ComponentProps<'div'>, 'children'> & {
  text: ReactNode
  visual: ReactNode
  // Visual on the left from the lg breakpoint up. The DOM order never changes.
  reverse?: boolean
}

// 12 column grid: text 5 columns, visual 7 (components.md section 13). Below lg it is one column
// with the text first and the visual second. The DOM order is always text then visual so reading
// order and focus order match the mobile layout; `reverse` only moves the columns visually on
// desktop, with explicit grid placement instead of `order`, which would not move the row.
export function Split({ text, visual, reverse = false, className, ...rest }: SplitProps) {
  return (
    <div
      {...rest}
      className={cx(
        'grid grid-cols-1 items-center gap-x-6 gap-y-10 lg:grid-cols-12 lg:gap-y-0',
        className,
      )}
    >
      <div
        className={cx(
          'lg:col-span-5 lg:row-start-1',
          reverse ? 'lg:col-start-8' : 'lg:col-start-1',
        )}
      >
        {text}
      </div>
      <div
        className={cx(
          'lg:col-span-7 lg:row-start-1',
          reverse ? 'lg:col-start-1' : 'lg:col-start-6',
        )}
      >
        {visual}
      </div>
    </div>
  )
}
