import { useMemo } from 'react'
import { useInternalPathname } from '@/i18n/use-internal-pathname'
import { whatsappContextFromPathname, whatsappHrefFor, type WhatsAppSettings } from '@/lib/whatsapp'
import type { NavService } from './nav-model'

/**
 * Context-aware wa.me link for the current page (product page asks about the product, a service
 * page about that service). `null` when settings carry no usable number: callers render no
 * WhatsApp control then, instead of a dead link.
 */
export function useWhatsAppHref(
  whatsapp: WhatsAppSettings | null,
  services: readonly NavService[],
): string | null {
  const pathname = useInternalPathname()
  return useMemo(() => {
    const context = whatsappContextFromPathname(pathname)
    if (context.kind === 'service') {
      // `{service name}` in a template is filled with the title the visitor sees in the menu.
      const name = services.find((service) => service.slug === context.slug)?.title
      return whatsappHrefFor(whatsapp, name ? { ...context, name } : context)
    }
    return whatsappHrefFor(whatsapp, context)
  }, [pathname, whatsapp, services])
}
