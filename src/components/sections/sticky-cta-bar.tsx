'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { Button } from '@/components/ui'
import { cx } from '@/components/ui/cx'
import { supportsIntersectionObserver } from '@/lib/motion/in-view'
import { WhatsAppGlyph } from './_internal/icons'
import type { CtaLink } from './_internal/types'
import styles from './sticky-cta-bar.module.css'

export type StickyCtaBarProps = {
  /**
   * The site setting "enable sticky CTA bar" (`features.enableStickyCtaBar`). Off renders
   * nothing at all, so the setting also removes the observers and the markup.
   */
  enabled?: boolean
  /** Accessible name of the bar's navigation landmark. */
  label: string
  primaryCta: CtaLink
  whatsappCta?: CtaLink | null
  /** Id of the hero CTA group (`ctaId` of HeroSplit): the bar shows once it has scrolled away. */
  heroTargetId: string
  /** Id of the final CTA block (`id` of FinalCta): the bar hides while it is on screen. */
  endTargetId: string
}

const DESKTOP_QUERY = '(min-width: 1024px)'

function subscribe(onChange: () => void) {
  if (typeof window.matchMedia !== 'function') return () => {}
  const mql = window.matchMedia(DESKTOP_QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}
// Mobile = below the desktop breakpoint. The server snapshot is false, so the bar is not part of
// the server HTML and never flashes on desktop; it mounts after the client knows the width.
const getMobile = () =>
  typeof window.matchMedia === 'function' && !window.matchMedia(DESKTOP_QUERY).matches

/** Watch one element; report the newest entry. Returns the disconnect function. */
function watch(el: Element, onEntry: (entry: IntersectionObserverEntry) => void) {
  const io = new IntersectionObserver((entries) => {
    const entry = entries[entries.length - 1]
    if (entry) onEntry(entry)
  })
  io.observe(el)
  return () => io.disconnect()
}

function Bar({
  label,
  primaryCta,
  whatsappCta,
  heroTargetId,
  endTargetId,
}: Omit<StickyCtaBarProps, 'enabled'>) {
  const mobile = useSyncExternalStore(subscribe, getMobile, () => false)
  // The hero CTA counts as "gone" only when it left through the top: a hero still below the fold
  // (page just loaded, or reloaded at the top) must not show the bar.
  const [heroGone, setHeroGone] = useState(false)
  const [endVisible, setEndVisible] = useState(false)

  useEffect(() => {
    if (!mobile || !supportsIntersectionObserver()) return
    const stops: (() => void)[] = []
    const hero = document.getElementById(heroTargetId)
    const end = document.getElementById(endTargetId)
    if (hero) {
      stops.push(
        watch(hero, (entry) =>
          setHeroGone(!entry.isIntersecting && entry.boundingClientRect.top < 0),
        ),
      )
    }
    if (end) stops.push(watch(end, (entry) => setEndVisible(entry.isIntersecting)))
    return () => {
      for (const stop of stops) stop()
      setHeroGone(false)
      setEndVisible(false)
    }
  }, [mobile, heroTargetId, endTargetId])

  if (!mobile) return null

  const visible = heroGone && !endVisible
  return (
    <nav
      data-slot="sticky-cta-bar"
      data-visible={visible}
      // A hidden bar must not be reachable by keyboard or announced.
      inert={!visible}
      aria-label={label}
      className={cx(
        styles.bar,
        'fixed inset-x-0 bottom-0 z-40 bg-surface shadow-lg [border-top:var(--border-hairline)]',
        'px-(--gutter) pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] motion-reduce:transition-none',
      )}
    >
      <div className="mx-auto flex max-w-(--container-max) gap-3">
        <Button href={primaryCta.href} size="md" className="min-w-0 flex-1 px-3">
          {primaryCta.label}
        </Button>
        {whatsappCta ? (
          // Buttons never wrap their label, and two full labels do not fit side by side on a
          // 390 px phone. Below 480 px the WhatsApp button shrinks to the glyph (a 44 px square)
          // and keeps its label for screen readers.
          <Button
            href={whatsappCta.href}
            variant="whatsapp"
            size="md"
            leadingIcon={<WhatsAppGlyph />}
            className="shrink-0 px-3 min-[480px]:min-w-0 min-[480px]:flex-1"
          >
            <span className="sr-only min-[480px]:not-sr-only">{whatsappCta.label}</span>
          </Button>
        ) : null}
      </div>
    </nav>
  )
}

/**
 * Mobile sticky CTA bar (motion.md section 4.5): slides up once the hero CTA has scrolled out
 * of view and hides again when the hero is back or the final CTA is on screen. Long pages only
 * (Home, Service detail, Product): the page decides by rendering it.
 *
 * Client component, so its links are plain anchors: next-intl's `Link` is a function and cannot
 * be passed in from a Server Component. The page resolves localised hrefs (for example with
 * `getPathname`) before passing them. The WhatsApp URL is external anyway.
 */
export function StickyCtaBar({ enabled = true, ...rest }: StickyCtaBarProps) {
  if (!enabled) return null
  return <Bar {...rest} />
}
