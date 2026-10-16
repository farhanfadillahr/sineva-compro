'use client'

import { useTranslations } from 'next-intl'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { cx, focusRing } from '@/components/ui/cx'
import { AppLink } from './app-link'
import { ArrowRightIcon, ChevronDownIcon } from './icons'
import styles from './layout.module.css'
import { MenuLinkItem } from './menu-link'
import { ariaCurrentFor, type NavModel } from './nav-model'
import { clampPanelX } from './panel-position'

type MenuId = 'product' | 'services'
/** How a panel was opened decides whether leaving with the pointer closes it again. */
type Via = 'hover' | 'click'
type Open = Readonly<{ id: MenuId; via: Via }>

// motion.md section 5: 80 ms intent delay before a hover opens a panel. The leave delay is not in
// the spec; it bridges the pointer crossing from a trigger into the panel without closing it.
const HOVER_INTENT_MS = 80
const HOVER_LEAVE_MS = 200

const PANEL_ID = 'site-nav-panel'

const menuTriggers: readonly MenuId[] = ['product', 'services']
// Each panel has a fixed width so the morph can interpolate to it; only its height is measured.
const contentWidth: Record<MenuId, string> = {
  product: 'w-[36rem]',
  services: 'w-[26rem]',
}

type Geometry = Readonly<{ x: number; width: number; height: number }>

const topLevel = (root: HTMLElement) =>
  Array.from(root.querySelectorAll<HTMLElement>('[data-nav-focusable]'))

/**
 * Primary navigation with ONE shared dropdown panel that morphs between Product and Services.
 *
 * Interaction model (disclosure pattern, not role="menu": these are navigation links):
 * - hover opens after an 80 ms intent delay, click/Enter/Space toggles, touch only has click;
 * - Escape, an outside pointer press, or focus leaving the nav closes it;
 * - ArrowDown opens and enters the panel, arrows/Home/End move inside, Tab enters from the
 *   trigger and leaves to the next top-level item (the panel sits after the nav list in the DOM,
 *   so native Tab order would skip Blog and About);
 * - ArrowLeft/Right move along the top level and switch the open panel with it.
 */
export function DesktopNav({
  model,
  pathname,
  reduced,
  onOpenChange,
}: {
  model: NavModel
  pathname: string | null
  reduced: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useTranslations('Nav')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRefs = useRef<Partial<Record<MenuId, HTMLButtonElement | null>>>({})
  const contentRefs = useRef<Partial<Record<MenuId, HTMLDivElement | null>>>({})
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const openRef = useRef<Open | null>(null)
  const focusFirstWhenOpen = useRef(false)

  const [open, setOpen] = useState<Open | null>(null)
  // Content stays mounted for the exit animation, so remember the last panel that was shown.
  const [shown, setShown] = useState<MenuId>('product')
  const [morph, setMorph] = useState(false)
  const [geometry, setGeometry] = useState<Geometry | null>(null)

  const clearTimers = useCallback(() => {
    clearTimeout(hoverTimer.current)
    clearTimeout(leaveTimer.current)
  }, [])

  const commit = useCallback((next: Open | null) => {
    const previous = openRef.current
    if (previous?.id === next?.id && previous?.via === next?.via) return
    // Switching between triggers while open slides and resizes; the first open only fades in.
    setMorph(previous !== null && next !== null)
    openRef.current = next
    setOpen(next)
    if (next) setShown(next.id)
  }, [])

  useEffect(() => clearTimers, [clearTimers])
  useEffect(() => onOpenChange(open !== null), [open, onOpenChange])

  // Outside press: the panel is not a modal, so a pointer anywhere else dismisses it.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: Event) => {
      if (!wrapperRef.current?.contains(event.target as Node)) commit(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, commit])

  // Size and place the panel under the active trigger. Skipped when nothing is measurable
  // (server render, jsdom); the CSS widths still give a usable layout then.
  useLayoutEffect(() => {
    if (!open) return
    const trigger = triggerRefs.current[open.id]
    const content = contentRefs.current[open.id]
    const root = wrapperRef.current?.closest<HTMLElement>('[data-nav-root]')
    if (!trigger || !content || !root) return
    // The panel is the content plus the card padding (2 x 8 px) and the 8 px pointer bridge on top.
    const width = content.offsetWidth + 16
    const height = content.offsetHeight + 24
    if (content.offsetWidth === 0 || content.offsetHeight === 0) return
    const rootBox = root.getBoundingClientRect()
    const triggerBox = trigger.getBoundingClientRect()
    const centred = triggerBox.left - rootBox.left + triggerBox.width / 2 - width / 2
    const rootStyle = getComputedStyle(root)
    setGeometry({
      x: clampPanelX({
        centred,
        rootWidth: rootBox.width,
        width,
        padLeft: parseFloat(rootStyle.paddingLeft) || 0,
        padRight: parseFloat(rootStyle.paddingRight) || 0,
      }),
      width,
      height,
    })
  }, [open])

  // ArrowDown opens and then moves focus into the panel once it is visible.
  useEffect(() => {
    if (open && focusFirstWhenOpen.current) {
      focusFirstWhenOpen.current = false
      panelLinks(open.id)[0]?.focus()
    }
  })

  function panelLinks(id: MenuId): HTMLElement[] {
    const content = contentRefs.current[id]
    return content ? Array.from(content.querySelectorAll<HTMLElement>('a[href]')) : []
  }

  function openMenu(id: MenuId, via: Via, enter = false) {
    clearTimers()
    if (enter) {
      if (openRef.current?.id === id) panelLinks(id)[0]?.focus()
      else focusFirstWhenOpen.current = true
    }
    commit({ id, via })
  }

  function closeMenu() {
    clearTimers()
    commit(null)
  }

  function onTriggerClick(id: MenuId) {
    clearTimers()
    const current = openRef.current
    if (current?.id !== id) openMenu(id, 'click')
    // A panel opened by hover is pinned by the click instead of closed: the pointer is already
    // on the trigger, so the visitor who clicks wants it to stay.
    else if (current.via === 'hover') commit({ id, via: 'click' })
    else closeMenu()
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    const target = event.target as HTMLElement
    const wrapper = wrapperRef.current
    if (!wrapper) return

    if (event.key === 'Escape') {
      const current = openRef.current
      if (!current) return
      event.preventDefault()
      const fromPanel = panelRef.current?.contains(target)
      closeMenu()
      if (fromPanel) triggerRefs.current[current.id]?.focus()
      return
    }

    const items = topLevel(wrapper)
    const topIndex = items.indexOf(target)
    if (topIndex !== -1) {
      const triggerId = target.dataset.menuTrigger as MenuId | undefined
      if (event.key === 'ArrowDown' && triggerId) {
        event.preventDefault()
        openMenu(triggerId, 'click', true)
      } else if (
        event.key === 'Tab' &&
        !event.shiftKey &&
        triggerId &&
        openRef.current?.id === triggerId
      ) {
        const first = panelLinks(triggerId)[0]
        if (first) {
          event.preventDefault()
          first.focus()
        }
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault()
        const step = event.key === 'ArrowRight' ? 1 : -1
        const next = items[(topIndex + step + items.length) % items.length]
        next.focus()
        const nextId = next.dataset.menuTrigger as MenuId | undefined
        // A panel that is open follows the focus; arriving on a plain link closes it.
        if (openRef.current) {
          if (nextId) commit({ id: nextId, via: openRef.current.via })
          else closeMenu()
        }
      }
      return
    }

    const current = openRef.current
    if (!current || !panelRef.current?.contains(target)) return
    const links = panelLinks(current.id)
    const index = links.indexOf(target.closest<HTMLElement>('a[href]') ?? target)
    if (index === -1) return
    const focusAt = (i: number) => links[(i + links.length) % links.length]?.focus()

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusAt(index + 1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusAt(index - 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusAt(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusAt(links.length - 1)
    } else if (event.key === 'Tab') {
      const trigger = triggerRefs.current[current.id]
      if (event.shiftKey && index === 0) {
        event.preventDefault()
        trigger?.focus()
      } else if (!event.shiftKey && index === links.length - 1) {
        const next = trigger ? items[items.indexOf(trigger) + 1] : undefined
        closeMenu()
        // Without a following item, native Tab order continues to the header actions.
        if (next) {
          event.preventDefault()
          next.focus()
        }
      }
    }
  }

  function onItemPointerEnter(event: PointerEvent<HTMLElement>, id: MenuId | null) {
    // Touch and pen have no hover; their tap arrives as a click.
    if (event.pointerType !== 'mouse') return
    clearTimers()
    const current = openRef.current
    if (id === null) {
      if (current?.via === 'hover') leaveTimer.current = setTimeout(closeMenu, HOVER_LEAVE_MS)
    } else if (current) {
      // Already open: follow the pointer at once so the panel morphs instead of lagging. The panel
      // is pointer-driven from here on (it closes when the pointer leaves); a click pins it.
      commit({ id, via: 'hover' })
    } else {
      hoverTimer.current = setTimeout(() => openMenu(id, 'hover'), HOVER_INTENT_MS)
    }
  }

  function onWrapperPointerLeave(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== 'mouse') return
    clearTimeout(hoverTimer.current)
    if (openRef.current?.via === 'hover') leaveTimer.current = setTimeout(closeMenu, HOVER_LEAVE_MS)
  }

  const isOpen = open !== null
  const panelStyle: CSSProperties = {
    visibility: isOpen ? 'visible' : 'hidden',
    ...(geometry
      ? { translate: `${geometry.x}px 0`, width: geometry.width, height: geometry.height }
      : {}),
  }

  return (
    <div
      ref={wrapperRef}
      // Full header height, so the pointer never leaves the wrapper on its way down to the panel.
      className="hidden h-full min-w-0 flex-1 items-center lg:flex"
      onKeyDown={onKeyDown}
      onBlur={(event) => {
        // Focus leaving the nav (or the window) closes the panel. relatedTarget is null for a
        // click on a non-focusable spot; the panel is tabIndex -1 so clicks inside it keep focus.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) closeMenu()
      }}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') clearTimeout(leaveTimer.current)
      }}
      onPointerLeave={onWrapperPointerLeave}
    >
      {/* The nav, not the wrapper, takes the header's edge offset: the panel inside the wrapper
          is positioned against the bar and must not move with it. */}
      <nav aria-label={t('primaryLabel')} className={styles.edgeStart}>
        <ul className={cx(styles.navList, 'm-0 flex list-none items-center gap-1 p-0')}>
          {menuTriggers.map((id) => (
            <li
              key={id}
              className={styles.navItem}
              onPointerEnter={(e) => onItemPointerEnter(e, id)}
            >
              <button
                ref={(node) => {
                  triggerRefs.current[id] = node
                }}
                type="button"
                data-nav-focusable=""
                data-menu-trigger={id}
                aria-expanded={open?.id === id}
                aria-controls={PANEL_ID}
                onClick={() => onTriggerClick(id)}
                className={cx(
                  'group/trigger inline-flex h-11 items-center gap-1 rounded-sm px-3.5 text-label text-text',
                  'transition-colors duration-(--dur-fast) ease-out hover:bg-canvas-alt aria-expanded:bg-canvas-alt',
                  'motion-reduce:transition-none',
                  focusRing,
                )}
              >
                {t(id)}
                <ChevronDownIcon className="size-4 transition-transform duration-300 ease-out group-aria-expanded/trigger:rotate-180 motion-reduce:transition-none" />
              </button>
            </li>
          ))}
          {model.plainLinks.map(({ key, href }) => (
            <li
              key={key}
              className={styles.navItem}
              onPointerEnter={(e) => onItemPointerEnter(e, null)}
            >
              <AppLink
                href={href}
                data-nav-focusable=""
                aria-current={ariaCurrentFor(pathname, href)}
                className={cx(
                  'inline-flex h-11 items-center rounded-sm px-3.5 text-label text-text no-underline',
                  'transition-colors duration-(--dur-fast) ease-out hover:bg-canvas-alt aria-[current=page]:bg-canvas-alt',
                  'motion-reduce:transition-none',
                  focusRing,
                )}
              >
                {t(key)}
              </AppLink>
            </li>
          ))}
        </ul>
      </nav>

      <div
        ref={panelRef}
        id={PANEL_ID}
        data-slot="nav-panel"
        data-state={isOpen ? 'open' : 'closed'}
        data-menu={shown}
        data-morph={morph}
        data-motion={reduced ? 'reduced' : 'full'}
        tabIndex={-1}
        inert={!isOpen}
        style={panelStyle}
        className={cx(styles.panel, 'absolute top-full left-0 z-10 pt-2 outline-none')}
      >
        <div className="relative size-full overflow-hidden rounded-lg border border-border bg-surface p-2 shadow-md">
          {menuTriggers.map((id) => {
            const active = isOpen && shown === id
            return (
              <div
                key={id}
                ref={(node) => {
                  contentRefs.current[id] = node
                }}
                role="group"
                aria-label={t(id)}
                data-menu-content={id}
                data-active={active}
                inert={!active}
                style={{ visibility: active ? 'visible' : 'hidden' }}
                className={cx(styles.content, 'absolute top-2 left-2', contentWidth[id])}
              >
                {id === 'product' ? (
                  <ProductContent model={model} pathname={pathname} onNavigate={closeMenu} />
                ) : (
                  <ServicesContent model={model} pathname={pathname} onNavigate={closeMenu} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ProductContent({
  model,
  pathname,
  onNavigate,
}: {
  model: NavModel
  pathname: string | null
  onNavigate: () => void
}) {
  const { items, promo } = model.product
  return (
    <>
      <ul className="m-0 grid list-none grid-cols-2 gap-0.5 p-0">
        {items.map((item) => (
          <li key={item.key}>
            <MenuLinkItem
              item={item}
              current={ariaCurrentFor(pathname, item.href)}
              onClick={onNavigate}
            />
          </li>
        ))}
      </ul>
      <AppLink
        href={promo.href}
        aria-current={ariaCurrentFor(pathname, promo.href)}
        onClick={onNavigate}
        className={cx(
          'group/promo mt-2 flex items-center justify-between gap-4 rounded-md bg-surface-tint p-4 text-text no-underline',
          focusRing,
        )}
      >
        <span className="grid gap-1">
          <span className="font-mono text-eyebrow tracking-[0.08em] text-text-brand uppercase">
            {promo.eyebrow}
          </span>
          <span className="text-[0.9375rem] font-semibold">{promo.title}</span>
          <span className="text-micro text-text-secondary">{promo.description}</span>
        </span>
        <ArrowRightIcon className="size-5 text-text-brand transition-transform duration-(--dur-fast) ease-out group-hover/promo:translate-x-[3px] motion-reduce:transition-none" />
      </AppLink>
    </>
  )
}

function ServicesContent({
  model,
  pathname,
  onNavigate,
}: {
  model: NavModel
  pathname: string | null
  onNavigate: () => void
}) {
  const { items, seeAll } = model.services
  return (
    <>
      <ul className="m-0 grid list-none gap-0.5 p-0">
        {items.map((item) => (
          <li key={item.key}>
            <MenuLinkItem
              item={item}
              current={ariaCurrentFor(pathname, item.href)}
              onClick={onNavigate}
            />
          </li>
        ))}
      </ul>
      <AppLink
        href={seeAll.href}
        aria-current={ariaCurrentFor(pathname, seeAll.href)}
        onClick={onNavigate}
        className={cx(
          'group/all mt-1 flex min-h-11 items-center justify-between gap-3 rounded-md px-3 text-label font-semibold text-text-brand no-underline',
          'transition-colors duration-(--dur-base) ease-out hover:bg-canvas-alt hover:duration-(--dur-instant) motion-reduce:transition-none',
          focusRing,
        )}
      >
        {seeAll.label}
        <ArrowRightIcon className="size-4 transition-transform duration-(--dur-fast) ease-out group-hover/all:translate-x-[3px] motion-reduce:transition-none" />
      </AppLink>
    </>
  )
}
