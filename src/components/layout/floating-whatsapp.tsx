'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { cx, focusRing } from '@/components/ui/cx'
import { usePrefersReducedMotion } from '@/lib/motion/reduced-motion'
import type { WhatsAppSettings } from '@/lib/whatsapp'
import { WhatsAppIcon } from './icons'
import styles from './layout.module.css'
import type { NavService } from './nav-model'
import { useWhatsAppHref } from './use-whatsapp-href'

/**
 * Floating WhatsApp button (components.md section 12): a 56 px circle on mobile, a pill with the
 * label "Chat with us" from 1024 px that collapses to the icon after the first scroll (hover or
 * focus expands it again). Renders nothing without a usable number.
 *
 * Layout contract with the sticky CTA bar: the bar publishes its height in the CSS variable
 * `--sticky-cta-offset` (on `<html>` or any ancestor) while it is visible, and this button lifts
 * by that amount so the two never overlap. Unset means 0.
 *
 * Analytics hook: `data-analytics="whatsapp_click"` with `data-location="floating"`; the
 * delegated listener that reads them is a separate ticket.
 */
export function FloatingWhatsApp({
  whatsapp,
  services,
}: {
  whatsapp: WhatsAppSettings | null
  services: readonly NavService[]
}) {
  const t = useTranslations('Whatsapp')
  const href = useWhatsAppHref(whatsapp, services)
  const reduced = usePrefersReducedMotion()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 0) setCollapsed(true)
    }
    // The page can load already scrolled (reload, anchor link): collapse right away.
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!href) return null

  return (
    <div
      data-slot="floating-whatsapp"
      data-collapsed={collapsed}
      data-motion={reduced ? 'reduced' : 'full'}
      className={cx(styles.fab, 'fixed right-4 bottom-4 z-30 md:right-6 md:bottom-6')}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('ariaLabel')}
        data-analytics="whatsapp_click"
        data-location="floating"
        className={cx(
          styles.fabInner,
          'flex size-14 items-center justify-center rounded-pill bg-surface text-text no-underline shadow-lg',
          'lg:w-auto lg:px-4',
          focusRing,
        )}
      >
        <WhatsAppIcon className="size-6 text-success" />
        <span
          className={cx(
            styles.fabLabel,
            'hidden text-label font-medium whitespace-nowrap lg:inline',
          )}
        >
          {t('label')}
        </span>
      </a>
    </div>
  )
}
