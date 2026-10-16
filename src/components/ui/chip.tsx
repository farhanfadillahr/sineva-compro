import type { ComponentProps, ReactNode } from 'react'
import { ActionElement, type ActionLinkComponent } from './action'
import { cx, focusRing, hitArea44 } from './cx'

type ChipOwnProps = {
  selected?: boolean
  disabled?: boolean
  linkComponent?: ActionLinkComponent
  className?: string
  children?: ReactNode
}
type ChipAsButton = ChipOwnProps &
  Omit<ComponentProps<'button'>, keyof ChipOwnProps> & { href?: undefined }
type ChipAsLink = ChipOwnProps &
  Omit<ComponentProps<'a'>, keyof ChipOwnProps | 'href'> & { href: string }
export type ChipProps = ChipAsButton | ChipAsLink

function Check() {
  return (
    <svg
      data-slot="check"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 shrink-0"
    >
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  )
}

// Filter chip (blog categories, work filters). A <button aria-pressed> when it filters in place, or
// a link with aria-current when each filter is its own URL. 36 px tall with an invisible 44 px
// touch target.
export function Chip(props: ChipProps) {
  const { selected = false, className, children, ...rest } = props
  const isLink = props.href !== undefined
  return (
    <ActionElement
      {...(rest as Record<string, unknown>)}
      {...(isLink
        ? { 'aria-current': selected ? 'true' : undefined }
        : { 'aria-pressed': selected })}
      className={cx(
        'relative inline-flex h-9 shrink-0 cursor-pointer select-none items-center gap-1.5',
        'whitespace-nowrap rounded-pill px-4 text-label no-underline',
        selected
          ? 'bg-surface-tint text-text-brand'
          : 'bg-canvas-alt text-text hover:bg-surface-tint',
        // The selected state pops with a small overshoot (motion.md section 6).
        'transition-[background-color,color,scale] duration-(--dur-fast) ease-bounce',
        'active:scale-[0.96] motion-reduce:transition-none',
        'aria-disabled:pointer-events-none aria-disabled:opacity-45 disabled:pointer-events-none disabled:opacity-45',
        hitArea44,
        focusRing,
        className,
      )}
    >
      {selected ? <Check /> : null}
      {children}
    </ActionElement>
  )
}
