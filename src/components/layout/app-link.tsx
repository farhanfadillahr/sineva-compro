import type { AnchorHTMLAttributes, Ref } from 'react'
import { Link } from '@/i18n/navigation'

type AppLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string
  ref?: Ref<HTMLAnchorElement>
}

/**
 * next-intl's `Link` with a plain string `href`. Its own type only accepts the app's known
 * pathnames, which rules out data-driven hrefs such as `/services/${slug}` and does not fit the
 * `linkComponent` prop of the shared Button. The cast is safe because every href built in this
 * folder comes from the pathname table in src/i18n/routing.ts (see nav-model.ts).
 */
export function AppLink({ href, ...rest }: AppLinkProps) {
  return <Link {...rest} href={href as never} />
}
