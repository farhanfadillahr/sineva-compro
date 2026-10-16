import type { ComponentProps } from 'react'
import { cx } from '@/components/ui/cx'

type IconProps = ComponentProps<'svg'>

// Stroke icons on a 24 px grid at 1.75 px, the Lucide style the rest of the kit uses. They sit
// next to a text label, so they are decorative (aria-hidden). `data-icon` names the glyph for
// tests and lets the copy button's state change be asserted without reading pixels.
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

export function LinkGlyph(props: IconProps) {
  return (
    <Icon {...props} data-icon="link">
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.43" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.33-1.33" />
    </Icon>
  )
}

/** Static check for the copied state. The animated `check-pop` Lottie (L3) is not built yet. */
export function CheckGlyph({ className, ...rest }: IconProps) {
  return (
    <Icon {...rest} data-icon="check" className={cx('text-success', className)}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Icon>
  )
}

export function LinkedInGlyph(props: IconProps) {
  return (
    <Icon {...props} data-icon="linkedin">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6Z" />
      <path d="M2 9h4v12H2z" />
      <circle cx="4" cy="4" r="2" />
    </Icon>
  )
}
