import type { ActionLinkComponent } from '@/components/ui'

/** A call to action. The page resolves the label (messages or CMS) and the final href. */
export type CtaLink = Readonly<{ label: string; href: string }>

/**
 * Optional localised link component (next-intl's `Link` from '@/i18n/navigation'). Blocks are
 * server components and render the Buttons themselves, so a function prop is allowed here. It
 * cannot cross into a client component, which is why StickyCtaBar takes plain hrefs instead.
 */
export type LinkProps = Readonly<{ linkComponent?: ActionLinkComponent }>
