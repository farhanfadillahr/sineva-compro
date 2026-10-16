import type { ReactNode } from 'react'
import type { ActionLinkComponent } from '@/components/ui'

/**
 * The stretched link of a media card: its `::after` covers the whole card, so the card is one
 * click target while the heading stays the accessible name of the link. Uses the localised link
 * component when the page passes one, a plain anchor otherwise.
 */
export function CardLink({
  href,
  linkComponent: LinkComponent,
  className,
  children,
}: {
  href: string
  linkComponent?: ActionLinkComponent
  className?: string
  children: ReactNode
}) {
  // Tailwind's `after:` variant already sets an empty `content`.
  const classes = ['after:absolute after:inset-0', className].filter(Boolean).join(' ')
  if (LinkComponent) {
    return (
      <LinkComponent href={href as never} className={classes}>
        {children}
      </LinkComponent>
    )
  }
  return (
    <a href={href} className={classes}>
      {children}
    </a>
  )
}
