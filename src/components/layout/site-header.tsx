'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { cx, focusRing } from '@/components/ui/cx'
import { usePathname } from '@/i18n/navigation'
import { usePrefersReducedMotion } from '@/lib/motion/reduced-motion'
import type { WhatsAppSettings } from '@/lib/whatsapp'
import { AppLink } from './app-link'
import { DesktopNav } from './desktop-nav'
import { MenuIcon, WhatsAppIcon } from './icons'
import { LanguageSwitcher } from './language-switcher'
import styles from './layout.module.css'
import { Logo } from './logo'
import { DESKTOP_QUERY } from './media-queries'
import { MOBILE_MENU_ID, MobileMenu } from './mobile-menu'
import { ariaCurrentFor, useNavModel, type NavService } from './nav-model'
import { useBodyScrollLock } from './use-body-scroll-lock'
import { useHeaderScroll } from './header-scroll'
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
 * Visibility rules live in `useHeaderScroll`; this component decides when the header is LOCKED
 * visible: a dropdown or the mobile menu is open, or keyboard focus is inside it. A mouse click
 * does not count as focus (see useKeyboardFocusWithin).
 *
 * Positioning: `sticky`, not `fixed`, so page content is never covered and pages that want the
 * hero gradient behind the transparent header pull themselves up with
 * `-mt-(--header-height)` and pad their top by the same amount.
 */
export function SiteHeader({
  services,
  whatsapp,
  showWork = true,
}: {
  services: readonly NavService[]
  whatsapp: WhatsAppSettings | null
  /** `false` hides the Work link (desktop and mobile) while there are no projects to list. */
  showWork?: boolean
}) {
  const t = useTranslations('Nav')
  const pathname = usePathname()
  const reduced = usePrefersReducedMotion()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const model = useNavModel(services, { showWork })
  const whatsappHref = useWhatsAppHref(whatsapp, services)

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobile, setMobile] = useState<MobilePhase>('closed')
  const burgerRef = useRef<HTMLButtonElement>(null)
  const focus = useKeyboardFocusWithin()

  const scroll = useHeaderScroll({
    locked: dropdownOpen || focus.inside || mobile !== 'closed',
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
        data-scrolled={scroll.scrolled}
        data-hidden={scroll.hidden}
        data-motion={reduced ? 'reduced' : 'full'}
        onFocus={focus.handlers.onFocus}
        onBlur={focus.handlers.onBlur}
        className={cx(
          styles.header,
          'sticky top-0 z-40 w-full border-b border-b-transparent bg-transparent',
          'data-[scrolled=true]:border-b-border data-[scrolled=true]:bg-(--surface-nav)',
        )}
      >
        <Container
          size="wide"
          data-nav-root=""
          className="relative flex h-[var(--header-height,4.5rem)] items-center gap-6"
        >
          <AppLink
            href="/"
            aria-label={t('homeLabel')}
            aria-current={ariaCurrentFor(pathname, '/')}
            className={cx('rounded-sm no-underline', focusRing)}
          >
            <Logo />
          </AppLink>

          <DesktopNav
            model={model}
            pathname={pathname}
            reduced={reduced}
            onOpenChange={setDropdownOpen}
          />

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <LanguageSwitcher />
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
            <Button href="/contact" linkComponent={AppLink} variant="dark">
              {t('bookConsultation')}
            </Button>
          </div>

          <button
            ref={burgerRef}
            type="button"
            aria-label={t('openMenu')}
            aria-expanded={mobile === 'open'}
            aria-controls={MOBILE_MENU_ID}
            onClick={() => setMobile('open')}
            // "Pressed key" look: the light bevel flattens and the key sinks 1 px on press.
            className={cx(
              'ml-auto flex size-11 items-center justify-center rounded-sm bg-surface text-text shadow-button-bevel-light lg:hidden',
              'transition-[translate,box-shadow] duration-(--dur-fast) ease-out active:translate-y-px active:shadow-xs motion-reduce:transition-none',
              focusRing,
            )}
          >
            <MenuIcon />
          </button>
        </Container>
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
