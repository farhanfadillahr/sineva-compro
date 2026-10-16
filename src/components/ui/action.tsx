import type { LaunchKind } from '@/components/mascot/sino-launch/launch-bus'
import type { AnchorHTMLAttributes, ComponentType, MouseEvent, ReactNode, Ref } from 'react'

// A link component such as next-intl's `Link` from '@/i18n/navigation'. It is passed in rather than
// imported so these primitives stay free of the i18n runtime: external hrefs (wa.me, mailto:) and
// the admin's unlocalised routes must not go through a localising Link, and the tests render
// without a next-intl provider. Gotcha: because it is a function prop, a Client Component cannot
// receive it from a Server Component; render the Button in the same server tree as the Link import.
//
// `href: never` is intentional. With typed routes, next-intl's Link only accepts the app's known
// pathnames, so a Link typed `href: string` would not be assignable to this prop. A component
// parameter type is checked contravariantly: declaring `never` here lets any Link through, and the
// string `href` the Button receives is forwarded with a cast. The cost is that the compiler does
// not check Button hrefs against the route table.
export type ActionLinkComponent = ComponentType<
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    href: never
    ref?: Ref<HTMLAnchorElement>
  }
>

export type ActionElementProps = {
  href?: string
  launch?: LaunchKind
  linkComponent?: ActionLinkComponent
  // Native disabled for buttons; aria-disabled and an inert href-less anchor for links.
  disabled?: boolean
  // Same inert behaviour as disabled, plus aria-busy. Used for loading buttons.
  busy?: boolean
  className?: string
  children?: ReactNode
  target?: string
  rel?: string
  type?: 'button' | 'submit' | 'reset'
  onClick?: (event: MouseEvent<HTMLElement>) => void
  ref?: Ref<HTMLElement>
  // Native attributes that differ between <a> and <button> (name, value, download ...) and the
  // aria-* / data-* set pass straight through; the public components type them precisely.
  [attribute: string]: unknown
}

// One element switch shared by Button and Chip so both behave identically for disabled, loading,
// external links and localised links.
export function ActionElement({
  href,
  launch,
  linkComponent: LinkComponent,
  disabled,
  busy,
  className,
  children,
  target,
  rel,
  type = 'button',
  onClick,
  ref,
  ...rest
}: ActionElementProps) {
  rest['data-sino-launch'] = launch
  const inert = Boolean(disabled || busy)
  const ariaState = {
    'aria-disabled': inert ? true : undefined,
    'aria-busy': busy ? true : undefined,
  }

  if (href === undefined) {
    return (
      <button
        {...rest}
        {...ariaState}
        ref={ref as Ref<HTMLButtonElement>}
        type={type}
        // The native attribute removes the button from the tab order and blocks clicks. A loading
        // button is disabled too (components.md section 1), so focus moves on instead of
        // sitting on a control that does nothing.
        disabled={inert}
        className={className}
        onClick={onClick}
      >
        {children}
      </button>
    )
  }

  if (inert) {
    // An anchor cannot be disabled. Dropping the href makes it non-navigable, and the caller
    // onClick is dropped with it, so there is nothing left to fire. role="link" keeps it announced
    // as a (disabled) link instead of plain text. No inline click guard on purpose: this runs in
    // Server Components, which cannot pass event handlers to DOM elements.
    return (
      <a
        {...rest}
        {...ariaState}
        ref={ref as Ref<HTMLAnchorElement>}
        role="link"
        tabIndex={-1}
        className={className}
      >
        {children}
      </a>
    )
  }

  // target=_blank without rel lets the opened page reach window.opener (reverse tabnabbing).
  // Older browsers still need noopener explicitly; a caller supplied rel always wins.
  const safeRel = rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined)
  const anchorProps = {
    ...rest,
    href,
    target,
    rel: safeRel,
    className,
    onClick,
  }
  if (LinkComponent) {
    return (
      <LinkComponent {...anchorProps} href={href as never} ref={ref as Ref<HTMLAnchorElement>}>
        {children}
      </LinkComponent>
    )
  }
  return (
    <a {...anchorProps} ref={ref as Ref<HTMLAnchorElement>}>
      {children}
    </a>
  )
}
