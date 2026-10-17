'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cx, focusRing } from '@/components/ui/cx'
import { useInternalPathname } from '@/i18n/use-internal-pathname'
import { usePrefersReducedMotion } from '@/lib/motion/reduced-motion'
import type { WhatsAppSettings } from '@/lib/whatsapp'
import { AppLink } from './app-link'
import { DesktopNav } from './desktop-nav'
import { MenuIcon, WhatsAppIcon } from './icons'
import { LanguageSwitcher } from './language-switcher'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import styles from './layout.module.css'
import { Logo } from './logo'
import { DESKTOP_QUERY } from './media-queries'
import { MOBILE_MENU_ID, MobileMenu } from './mobile-menu'
import { ariaCurrentFor, useNavModel, type NavService } from './nav-model'
import { useBodyScrollLock } from './use-body-scroll-lock'
import { useHeaderMode } from './header-scroll'
import { useKeyboardFocusWithin } from './use-keyboard-focus-within'
import { useMediaQuery } from './use-media-query'
import { useWhatsAppHref } from './use-whatsapp-href'

type MobilePhase = 'closed' | 'open' | 'closing'

// Matches the exit animation in layout.module.css (wipe 250 ms, reduced-motion fade 150 ms).
const CLOSE_MS = 250
const CLOSE_REDUCED_MS = 150

/**
 * The public site header (components.md section 2, motion.md section 5).
 *
 * Modes (regular at the top, floating pill below it, shown or hidden) live in the state machine in
 * `header-scroll.ts`; this component tells it when the header is HELD visible: a dropdown or the
 * mobile menu is open, or keyboard focus is inside it. A mouse click does not count as focus (see
 * useKeyboardFocusWithin). The pointer over the bar holds it too.
 *
 * Positioning: the `<header>` is `sticky`, not `fixed`, and always `--header-height` tall, so it
 * is the spacer that keeps CLS at 0: page content is never covered or pushed, and pages that want
 * the hero gradient behind the transparent header pull themselves up with `-mt-(--header-height)`
 * and pad their top by the same amount. The floating pill is a child (`header-bar`) drawn inside
 * that slot, see layout.module.css.
 */
export function SiteHeader({
  services,
  whatsapp,
  showWork = true,
  showWaitlist = true,
}: {
  services: readonly NavService[]
  whatsapp: WhatsAppSettings | null
  /** `false` hides the Work link (desktop and mobile) while there are no projects to list. */
  showWork?: boolean
  /** `false` hides the waitlist promo card once the product is live (CPR-106). */
  showWaitlist?: boolean
}) {
  const t = useTranslations('Nav')
  const pathname = useInternalPathname()
  const reduced = usePrefersReducedMotion()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const model = useNavModel(services, { showWork, showWaitlist })
  const whatsappHref = useWhatsAppHref(whatsapp, services)

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobile, setMobile] = useState<MobilePhase>('closed')
  const burgerRef = useRef<HTMLButtonElement>(null)
  const focus = useKeyboardFocusWithin()

  const { mode, pointerHandlers } = useHeaderMode({
    menuOpen: dropdownOpen || mobile !== 'closed',
    keyboardFocus: focus.inside,
    frozen: mobile === 'open',
  })
  useBodyScrollLock(mobile === 'open')

  const closeMenu = useCallback(
    () => setMobile((phase) => (phase === 'open' ? 'closing' : phase)),
    [],
  )

  // Closing: give the exit animation its time, then unmount.
  useEffect(() => {
    if (mobile !== 'closing') return
    const timer = setTimeout(() => setMobile('closed'), reduced ? CLOSE_REDUCED_MS : CLOSE_MS)
    return () => clearTimeout(timer)
  }, [mobile, reduced])

  // Focus returns to the burger once the sheet starts closing. Done in an effect, not in the
  // click handler: the sheet's focus guard is removed by its own effect cleanup, which runs first.
  const wasOpen = useRef(false)
  useEffect(() => {
    if (mobile === 'closing' && wasOpen.current) burgerRef.current?.focus()
    wasOpen.current = mobile === 'open'
  }, [mobile])

  // The layout survives client-side navigation, so the sheet must close itself on a route change.
  const previousPathname = useRef(pathname)
  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname
      closeMenu()
    }
  }, [pathname, closeMenu])

  // A tablet rotated to the desktop layout leaves no burger to return to: drop the sheet at once.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isDesktop) setMobile('closed')
  }, [isDesktop])

  return (
    <>
      <header
        data-mode={mode}
        data-motion={reduced ? 'reduced' : 'full'}
        onFocus={focus.handlers.onFocus}
        onBlur={focus.handlers.onBlur}
        className={cx(styles.header, 'sticky top-0 z-40 h-[var(--header-height,4.5rem)] w-full')}
      >
        <div
          data-slot="header-bar"
          data-nav-root=""
          {...pointerHandlers}
          className={cx(styles.bar, 'relative flex items-center gap-6')}
        >
          <AppLink
            href="/"
            aria-label={t('homeLabel')}
            aria-current={ariaCurrentFor(pathname, '/')}
            className={cx(styles.edgeStart, 'rounded-sm no-underline', focusRing)}
          >
            <Logo />
          </AppLink>

          <DesktopNav
            model={model}
            pathname={pathname}
            reduced={reduced}
            onOpenChange={setDropdownOpen}
          />

          <div className={cx(styles.edgeEnd, 'ml-auto hidden items-center gap-2 lg:flex')}>
            <ThemeToggle
              labels={{ toDark: t('themeToDark'), toLight: t('themeToLight') }}
              className={cx(
                'flex size-11 items-center justify-center rounded-sm text-text hover:bg-surface-tint transition-colors duration-(--dur-fast) motion-reduce:transition-none',
                focusRing,
              )}
            />
            <LanguageSwitcher
              className={cx(
                'flex h-11 min-w-11 items-center justify-center rounded-sm px-2 text-label text-text no-underline hover:bg-surface-tint transition-colors duration-(--dur-fast) motion-reduce:transition-none',
                focusRing,
              )}
            />
            {whatsappHref ? (
              <Button
                href={whatsappHref}
                target="_blank"
                variant="ghost"
                leadingIcon={<WhatsAppIcon className="text-success" />}
                data-analytics="whatsapp_click"
                data-location="header"
              >
                {t('chatOnWhatsapp')}
              </Button>
            ) : null}
            <Button href="/contact" launch="booking" linkComponent={AppLink} variant="dark">
              {t('bookConsultation')}
            </Button>
          </div>

          {/* The wrapper carries the edge offset: the burger's own `translate` is its press effect. */}
          <span className={cx(styles.edgeEnd, 'ml-auto flex lg:hidden')}>
            <button
              ref={burgerRef}
              type="button"
              aria-label={t('openMenu')}
              aria-expanded={mobile === 'open'}
              aria-controls={MOBILE_MENU_ID}
              onClick={() => setMobile('open')}
              // "Pressed key" look: the light bevel flattens and the key sinks 1 px on press.
              className={cx(
                'flex size-11 items-center justify-center rounded-sm bg-surface text-text shadow-button-bevel-light',
                'transition-[translate,box-shadow] duration-(--dur-fast) ease-out active:translate-y-px active:shadow-xs motion-reduce:transition-none',
                focusRing,
              )}
            >
              <MenuIcon />
            </button>
          </span>
        </div>
      </header>

      {mobile !== 'closed' ? (
        <MobileMenu
          phase={mobile}
          model={model}
          pathname={pathname}
          whatsappHref={whatsappHref}
          reduced={reduced}
          onClose={closeMenu}
        />
      ) : null}
    </>
  )
}
