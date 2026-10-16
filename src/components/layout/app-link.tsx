import type { AnchorHTMLAttributes, Ref } from 'react'
import { parseAppHref } from '@/i18n/href'
import { Link } from '@/i18n/navigation'

type AppLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string
  ref?: Ref<HTMLAnchorElement>
}

/**
 * next-intl's `Link` with a plain string `href`. Its own type only accepts the app's known
 * pathnames, which rules out data-driven hrefs such as `/services/${slug}` and does not fit the
 * `linkComponent` prop of the shared Button. The string is resolved to its internal pathname and
 * params first, so the link gets the localized path of the current locale (`/id/layanan/...`);
 * anything that is not an app page passes through unchanged.
 */
export function AppLink({ href, ...rest }: AppLinkProps) {
  return <Link {...rest} href={(parseAppHref(href) ?? href) as never} />
}
