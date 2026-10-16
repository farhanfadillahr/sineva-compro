'use client'

import { useTranslations } from 'next-intl'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { Button } from '@/components/ui/button'
import { cx, focusRing } from '@/components/ui/cx'
import { AppLink } from './app-link'
import { Collapse } from './collapse'
import { ChevronDownIcon, CloseIcon, WhatsAppIcon } from './icons'
import { LanguageSwitcher } from './language-switcher'
import styles from './layout.module.css'
import { Logo } from './logo'
import { MenuLinkItem } from './menu-link'
import { ariaCurrentFor, type NavModel } from './nav-model'

export const MOBILE_MENU_ID = 'mobile-menu'

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

const plainLinks = [
  { key: 'work', href: '/work' },
  { key: 'blog', href: '/blog' },
  { key: 'about', href: '/about' },
] as const

const rowClass = 'border-b border-border'

/**
 * Full-screen mobile navigation. It is a real modal dialog that contains everything focusable
 * while open (its own logo and close button included), so the focus trap only has to cycle inside
 * one element and assistive technology that ignores aria-modal still gets a sensible tree.
 *
 * Focus handling, in order of how it fails on real devices:
 * - Tab and Shift+Tab wrap at the ends (keydown);
 * - focus that arrives from outside anyway (screen reader virtual cursor, autofill, a script) is
 *   pulled back in (focusin), which is the part a keydown-only trap misses.
 */
export function MobileMenu({
  phase,
  model,
  pathname,
  whatsappHref,
  reduced,
  onClose,
}: {
  phase: 'open' | 'closing'
  model: NavModel
  pathname: string | null
  whatsappHref: string | null
  reduced: boolean
  onClose: () => void
}) {
  const t = useTranslations('Nav')
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [expanded, setExpanded] = useState<'product' | 'services' | null>(null)
  const closing = phase === 'closing'

  // Focus moves in once, when the sheet mounts.
  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    if (closing) return
    const onFocusIn = (event: FocusEvent) => {
      if (!dialogRef.current?.contains(event.target as Node)) closeRef.current?.focus()
    }
    document.addEventListener('focusin', onFocusIn)
    return () => document.removeEventListener('focusin', onFocusIn)
  }, [closing])

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key !== 'Tab') return
    const items = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
    ).filter(
      // Links in a collapsed accordion are inert; they are not part of the tab order.
      (element) => !element.closest('[inert]'),
    )
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement
    if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const toggle = (id: 'product' | 'services') =>
    setExpanded((current) => (current === id ? null : id))

  return (
    <div
      ref={dialogRef}
      id={MOBILE_MENU_ID}
      role="dialog"
      aria-modal="true"
      aria-label={t('menu')}
      data-state={phase}
      data-motion={reduced ? 'reduced' : 'full'}
      inert={closing}
      onKeyDown={onKeyDown}
      className={cx(styles.sheet, 'fixed inset-0 z-50 flex flex-col bg-canvas lg:hidden')}
    >
      <div className="flex h-18 shrink-0 items-center justify-between px-(--gutter)">
        <AppLink
          href="/"
          aria-label={t('homeLabel')}
          aria-current={ariaCurrentFor(pathname, '/')}
          onClick={onClose}
          className={cx('rounded-sm no-underline', focusRing)}
        >
          <Logo />
        </AppLink>
        <button
          ref={closeRef}
          type="button"
          aria-label={t('closeMenu')}
          onClick={onClose}
          className={cx(
            'flex size-11 items-center justify-center rounded-sm bg-surface text-text shadow-button-bevel-light',
            'transition-transform duration-(--dur-fast) ease-out active:scale-[0.96] motion-reduce:transition-none',
            focusRing,
          )}
        >
          <CloseIcon />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-(--gutter) pb-6">
        <nav aria-label={t('primaryLabel')}>
          <ul className="m-0 list-none p-0">
            <Row index={0}>
              <Accordion
                id="product"
                label={t('product')}
                open={expanded === 'product'}
                onToggle={() => toggle('product')}
              >
                <ul className="m-0 grid list-none gap-0.5 p-0 pb-3">
                  {model.product.items.map((item) => (
                    <li key={item.key}>
                      <MenuLinkItem
                        item={item}
                        current={ariaCurrentFor(pathname, item.href)}
                        onClick={onClose}
                        className="focus-visible:-outline-offset-2"
                      />
                    </li>
                  ))}
                  <li>
                    <AppLink
                      href={model.product.promo.href}
                      onClick={onClose}
                      className={cx(
                        'mt-1 grid gap-1 rounded-md bg-surface-tint p-4 text-text no-underline focus-visible:-outline-offset-2',
                        focusRing,
                      )}
                    >
                      <span className="font-mono text-eyebrow tracking-[0.08em] text-text-brand uppercase">
                        {model.product.promo.eyebrow}
                      </span>
                      <span className="text-[0.9375rem] font-semibold">
                        {model.product.promo.title}
                      </span>
                      <span className="text-micro text-text-secondary">
                        {model.product.promo.description}
                      </span>
                    </AppLink>
                  </li>
                </ul>
              </Accordion>
            </Row>
            <Row index={1}>
              <Accordion
                id="services"
                label={t('services')}
                open={expanded === 'services'}
                onToggle={() => toggle('services')}
              >
                <ul className="m-0 grid list-none gap-0.5 p-0 pb-3">
                  {model.services.items.map((item) => (
                    <li key={item.key}>
                      <MenuLinkItem
                        item={item}
                        current={ariaCurrentFor(pathname, item.href)}
                        onClick={onClose}
                        className="focus-visible:-outline-offset-2"
                      />
                    </li>
                  ))}
                  <li>
                    <AppLink
                      href={model.services.seeAll.href}
                      aria-current={ariaCurrentFor(pathname, model.services.seeAll.href)}
                      onClick={onClose}
                      className={cx(
                        'flex min-h-11 items-center rounded-md px-3 text-label font-semibold text-text-brand no-underline focus-visible:-outline-offset-2',
                        focusRing,
                      )}
                    >
                      {model.services.seeAll.label}
                    </AppLink>
                  </li>
                </ul>
              </Accordion>
            </Row>
            {plainLinks.map(({ key, href }, i) => (
              <Row key={key} index={i + 2}>
                <AppLink
                  href={href}
                  aria-current={ariaCurrentFor(pathname, href)}
                  onClick={onClose}
                  className={cx(
                    'flex min-h-14 items-center text-h4 text-text no-underline',
                    focusRing,
                  )}
                >
                  {t(key)}
                </AppLink>
              </Row>
            ))}
          </ul>
        </nav>
        <LanguageSwitcher />
      </div>

      {/* Fixed bottom action bar: the two conversion paths stay one thumb away at any scroll. */}
      <div className="flex shrink-0 flex-col gap-3 border-t border-border bg-canvas p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row">
        <Button
          href="/contact"
          linkComponent={AppLink}
          variant="primary"
          size="lg"
          withArrow
          onClick={onClose}
          className="w-full sm:w-auto sm:flex-1"
        >
          {t('bookConsultation')}
        </Button>
        {whatsappHref ? (
          <Button
            href={whatsappHref}
            target="_blank"
            variant="whatsapp"
            size="lg"
            leadingIcon={<WhatsAppIcon className="text-success" />}
            data-analytics="whatsapp_click"
            data-location="mobile_menu"
            className="w-full sm:w-auto sm:flex-1"
          >
            {t('chatOnWhatsapp')}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

/** A top-level row. `--i` drives the 40 ms stagger in layout.module.css. */
function Row({ index, children }: { index: number; children: ReactNode }) {
  return (
    <li className={cx(styles.row, rowClass)} style={{ '--i': index } as CSSProperties}>
      {children}
    </li>
  )
}

function Accordion({
  id,
  label,
  open,
  onToggle,
  children,
}: {
  id: string
  label: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  const regionId = useId()
  return (
    <>
      <div>
        <button
          type="button"
          id={`${regionId}-trigger`}
          aria-expanded={open}
          aria-controls={regionId}
          data-accordion={id}
          onClick={onToggle}
          className={cx(
            'flex min-h-14 w-full items-center justify-between text-left text-h4 text-text',
            focusRing,
          )}
        >
          {label}
          <ChevronDownIcon
            className={cx(
              'size-5 transition-transform duration-300 ease-out motion-reduce:transition-none',
              open && 'rotate-180',
            )}
          />
        </button>
      </div>
      <Collapse open={open} id={regionId}>
        {children}
      </Collapse>
    </>
  )
}
