import type { ComponentProps, ReactNode } from 'react'
import { ActionElement, type ActionLinkComponent } from './action'
import { cx, focusRing, hitArea44 } from './cx'

export type ButtonVariant = 'primary' | 'dark' | 'secondary' | 'ghost' | 'link' | 'whatsapp'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

// docs/design/components.md section 1. Two shapes: a pill (rounded-pill) for marketing CTAs and a
// 10 px rounded square (rounded-sm) for compact UI. Hover and press follow motion.md section 6.
const PRESS = 'active:scale-[0.98]'

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: cx(
    'rounded-pill bg-action-primary text-text-inverse shadow-button-bevel',
    'hover:-translate-y-0.5 hover:bg-action-primary-hover',
    PRESS,
  ),
  // The "hover gradient fill sweep" is a background-size transition on a gradient layer over the
  // solid colour, not a ::before. A pseudo-element would need overflow-hidden on the button, which
  // would clip the invisible 44 px hit area of the sm size and the focus outline.
  dark: cx(
    'rounded-sm bg-action-dark text-text-inverse shadow-button-bevel',
    'bg-(image:--gradient-brand) bg-size-[100%_0%] bg-bottom bg-no-repeat hover:bg-size-[100%_100%]',
    PRESS,
  ),
  secondary: cx(
    'rounded-pill bg-surface text-text shadow-button-bevel-light',
    'hover:bg-canvas-alt',
    PRESS,
  ),
  ghost: cx('rounded-sm bg-transparent text-text', 'hover:bg-canvas-alt', PRESS),
  // Underline grows from the left on hover (motion.md section 6) via background-size.
  link: cx(
    'rounded-xs text-(--color-link) underline-offset-4',
    'bg-[linear-gradient(currentColor,currentColor)] bg-position-[0_100%] bg-size-[0%_1.5px] bg-no-repeat',
    'hover:bg-size-[100%_1.5px]',
  ),
  // Same brand-neutral surface as secondary; the WhatsApp glyph is passed as leadingIcon.
  whatsapp: cx(
    'rounded-pill bg-surface text-text shadow-button-bevel-light',
    'hover:bg-canvas-alt',
    PRESS,
  ),
}

// Heights 36 / 44 / 52 / 60 px. sm is 36 px by spec, so it carries an invisible 44 px hit area.
export const buttonSizeClasses: Record<ButtonSize, string> = {
  sm: cx('h-9 px-3.5 text-[0.875rem]', hitArea44),
  md: 'h-11 px-5 text-label',
  lg: 'h-13 px-6 text-base',
  xl: 'h-15 px-7 text-[1.0625rem]',
}

// The link variant is inline text: no fixed height or horizontal padding, only the type size.
const linkSizeClasses: Record<ButtonSize, string> = {
  sm: 'text-[0.875rem]',
  md: 'text-label',
  lg: 'text-base',
  xl: 'text-[1.0625rem]',
}

const BASE = cx(
  'group/button relative inline-flex shrink-0 select-none items-center justify-center gap-2',
  'whitespace-nowrap font-medium leading-[1.2] no-underline',
  // Only these properties move; background-size is the dark and link variant sweep.
  'transition-[background-color,background-size,color,translate,scale,box-shadow]',
  'duration-(--dur-base) ease-out motion-reduce:transition-none',
  focusRing,
  // 45 % opacity and no hover, for both native disabled and the aria-disabled link/loading state.
  'disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45',
)

type ButtonOwnProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  // Keeps the label, swaps the trailing icon for a spinner, sets aria-busy and disables the control.
  loading?: boolean
  // Text announced while loading (from messages, never hardcoded). Visually hidden.
  loadingLabel?: string
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  // Trailing arrow that nudges 3 px on hover, for CTAs that navigate.
  withArrow?: boolean
  // Declared here so links accept it too (rendered as an inert, aria-disabled link).
  disabled?: boolean
  // Renders this component (for example next-intl's Link) instead of <a> when `href` is set.
  linkComponent?: ActionLinkComponent
  className?: string
  children?: ReactNode
}

type ButtonAsButton = ButtonOwnProps &
  Omit<ComponentProps<'button'>, keyof ButtonOwnProps> & { href?: undefined }
type ButtonAsLink = ButtonOwnProps &
  Omit<ComponentProps<'a'>, keyof ButtonOwnProps | 'href'> & { href: string }

export type ButtonProps = ButtonAsButton | ButtonAsLink

function Spinner() {
  return (
    <svg
      data-slot="spinner"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className="size-4 shrink-0 motion-safe:animate-spin"
    >
      <circle cx="12" cy="12" r="9" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  )
}

function Arrow() {
  return (
    <svg
      data-slot="arrow"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 shrink-0 transition-[translate] duration-(--dur-fast) ease-out group-hover/button:translate-x-[3px] motion-reduce:transition-none"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingLabel,
    leadingIcon,
    trailingIcon,
    withArrow = false,
    className,
    children,
    ...rest
  } = props

  const trailing = loading ? (
    <Spinner />
  ) : trailingIcon ? (
    <span aria-hidden="true" className="inline-flex shrink-0">
      {trailingIcon}
    </span>
  ) : withArrow ? (
    <Arrow />
  ) : null

  return (
    <ActionElement
      {...(rest as Record<string, unknown>)}
      busy={loading}
      data-variant={variant}
      data-size={size}
      className={cx(
        BASE,
        buttonVariantClasses[variant],
        variant === 'link' ? linkSizeClasses[size] : buttonSizeClasses[size],
        className,
      )}
    >
      {leadingIcon ? (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {leadingIcon}
        </span>
      ) : null}
      {children}
      {loading && loadingLabel ? (
        <span data-slot="loading-label" className="sr-only">
          {loadingLabel}
        </span>
      ) : null}
      {trailing}
    </ActionElement>
  )
}
