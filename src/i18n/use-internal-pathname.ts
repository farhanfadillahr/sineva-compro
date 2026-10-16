import { useParams } from 'next/navigation'
import { fillPathname } from './href'
import { usePathname } from './navigation'

/**
 * The current page as an internal, locale-less path with its params filled in
 * (`/services/ai-build` on `/id/layanan/ai-build`). next-intl's `usePathname` returns the template
 * (`/services/[slug]`) for a dynamic route, which matches no nav href and no service slug.
 */
export function useInternalPathname(): string {
  const template = usePathname()
  const params = useParams()
  return fillPathname(template, params)
}
