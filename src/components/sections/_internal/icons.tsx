import type { ComponentProps } from 'react'
import { cx } from '@/components/ui/cx'

type IconProps = ComponentProps<'svg'>

// Stroke icons on a 24 px grid at 1.75 px, the Lucide style the rest of the kit uses. They are
// decorative: the label next to them carries the meaning, so they are aria-hidden.
function Icon({ className, children, ...rest }: IconProps) {
  return (
    <svg
      {...rest}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cx('size-5 shrink-0', className)}
    >
      {children}
    </svg>
  )
}

/** Chat bubble glyph for WhatsApp CTAs. The success green marks it; the label names the action. */
export function WhatsAppGlyph({ className, ...rest }: IconProps) {
  return (
    <Icon {...rest} className={cx('text-success', className)}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-.8.8c-.9-.4-1.6-1.1-2-2l.8-.8-1-2Z" />
    </Icon>
  )
}

export function PlusGlyph({ className, ...rest }: IconProps) {
  return (
    <Icon {...rest} className={className}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Icon>
  )
}
