'use client'

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cx, focusRing } from '@/components/ui/cx'
import { loadGsap } from '@/lib/motion/gsap'
import { observeVisibility } from '@/lib/motion/in-view'
import { prefersReducedMotion, usePrefersReducedMotion } from '@/lib/motion/reduced-motion'
import styles from './sticky-steps-story.module.css'

export type StoryStep = Readonly<{ title: string; body: string; screen?: ReactNode }>

const DESKTOP_QUERY = '(min-width: 1024px)'

function subscribeDesktop(onChange: () => void) {
  if (typeof window.matchMedia !== 'function') return () => {}
  const mql = window.matchMedia(DESKTOP_QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}
const getDesktop = () =>
  typeof window.matchMedia === 'function' && window.matchMedia(DESKTOP_QUERY).matches

/**
 * The sticky step story (motion.md section 4.2): a sticky screen column and a list of steps on
 * desktop, a plain stacked list with a screen per step below 1024 px.
 *
 * Semantics: an ARIA tabs pattern. The step titles are the tabs (roving tabindex, arrow keys,
 * Home and End), the sticky column is the one tabpanel and shows the selected step's screen. The
 * step body is the tab's description. The screens are decorative mockups (aria-hidden), so
 * screen readers get the same content from the tab list.
 *
 * Scroll mapping: on desktop with motion allowed, GSAP and ScrollTrigger are loaded only when
 * the block comes within 200 px of the viewport, and one ScrollTrigger over the step list maps
 * scroll progress to the active step. There is no pinning (the column is CSS `position:
 * sticky`) and no scroll hijacking. Under reduced motion, on mobile, or before the block is near
 * the viewport, GSAP is never requested and the tabs still work by click and keyboard.
 *
 * Gotchas:
 * - `useGsapContext` loads GSAP at mount; it is not used because the load must wait for
 *   visibility, so this component asks `loadGsap` itself and owns the cleanup.
 * - A scroll update only changes the active step when the scroll-derived step changes, so a
 *   click or arrow-key selection is not undone by the next scroll tick, only by scrolling to a
 *   different step.
 */
export function StickyStepsStory({ steps }: { steps: readonly StoryStep[] }) {
  const baseId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const trigger = useRef<{ start: number; end: number } | null>(null)
  const lastScrollIndex = useRef(0)
  const [active, setActive] = useState(0)
  const isDesktop = useSyncExternalStore(subscribeDesktop, getDesktop, () => false)
  const reduced = usePrefersReducedMotion()
  const count = steps.length

  useEffect(() => {
    const root = rootRef.current
    const list = listRef.current
    // Read the live preference too: during hydration the hook still reports its server value.
    if (!root || !list || !isDesktop || reduced || prefersReducedMotion()) return

    let disposed = false
    let kill: (() => void) | undefined

    const stop = observeVisibility(
      root,
      (visible) => {
        if (!visible) return
        // One sighting is enough: load once, then stop watching.
        stop()
        loadGsap().then(
          (bundle) => {
            if (!bundle || disposed) return
            const { gsap, ScrollTrigger } = bundle
            const context = gsap.context(() => {
              const st = ScrollTrigger.create({
                trigger: list,
                start: 'top center',
                end: 'bottom center',
                // Progress is read directly in onUpdate; scrub makes the update follow the
                // scroll position without easing or debounce.
                scrub: true,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                  const index = Math.min(count - 1, Math.max(0, Math.floor(self.progress * count)))
                  if (index === lastScrollIndex.current) return
                  lastScrollIndex.current = index
                  setActive(index)
                },
              })
              trigger.current = st
              kill = () => st.kill()
            }, root)
            const killTrigger = kill
            kill = () => {
              killTrigger?.()
              context.revert()
            }
          },
          // Animation is an enhancement: a failed chunk load leaves the working static tabs.
          () => {},
        )
      },
      { rootMargin: '200px 0px' },
    )

    return () => {
      disposed = true
      stop()
      kill?.()
      trigger.current = null
    }
  }, [isDesktop, reduced, count])

  const select = (index: number, scrollTo: boolean) => {
    setActive(index)
    const st = trigger.current
    if (scrollTo && st) {
      // Bring the page to the middle of that step's share of the scroll range.
      const top = st.start + ((index + 0.5) / count) * (st.end - st.start)
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = count - 1
    const target =
      event.key === 'ArrowDown' || event.key === 'ArrowRight'
        ? index === last
          ? 0
          : index + 1
        : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
          ? index === 0
            ? last
            : index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null
    if (target === null) return
    event.preventDefault()
    tabRefs.current[target]?.focus()
    // Selection follows focus, without scrolling the page under the user's fingers.
    select(target, false)
  }

  const tabId = (index: number) => `${baseId}-tab-${index}`
  const panelId = `${baseId}-panel`

  return (
    <div
      ref={rootRef}
      data-slot="sticky-steps"
      className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-12"
    >
      <div
        ref={listRef}
        data-slot="steps-list"
        role="tablist"
        aria-orientation="vertical"
        className="flex flex-col gap-10 lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:gap-0"
      >
        {steps.map((step, index) => {
          const isActive = index === active
          return (
            <div
              key={index}
              role="presentation"
              data-active={isActive}
              className={cx(styles.step, 'flex flex-col gap-6 lg:min-h-[38vh] lg:justify-center')}
            >
              <button
                ref={(el) => {
                  tabRefs.current[index] = el
                }}
                id={tabId(index)}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={panelId}
                aria-labelledby={`${tabId(index)}-title`}
                aria-describedby={`${tabId(index)}-body`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => select(index, true)}
                onKeyDown={(event) => onKeyDown(event, index)}
                className={cx(
                  'flex min-h-11 w-full cursor-pointer items-start gap-4 border-s-2 ps-5 text-start',
                  isActive ? 'border-action-primary' : 'border-transparent',
                  focusRing,
                )}
              >
                <span aria-hidden="true" className="pt-1.5 font-mono text-eyebrow text-text-brand">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="flex flex-col gap-2">
                  <span
                    id={`${tabId(index)}-title`}
                    className={cx(styles.title, 'font-semibold text-text')}
                  >
                    {step.title}
                  </span>
                  <span id={`${tabId(index)}-body`} className={styles.body}>
                    <span
                      className={cx(
                        styles.bodyInner,
                        'block text-body text-pretty text-text-secondary',
                      )}
                    >
                      {step.body}
                    </span>
                  </span>
                </span>
              </button>
              {step.screen ? (
                // Stacked layout only: each step carries its own screen, no sticky column.
                <div data-slot="step-screen" aria-hidden="true" className="lg:hidden">
                  {step.screen}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={tabId(active)}
        data-slot="story-visual"
        className="hidden lg:sticky lg:top-28 lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:block lg:self-start"
      >
        <div className={styles.screens}>
          {steps.map((step, index) => (
            <div
              key={index}
              data-active={index === active}
              aria-hidden="true"
              className={styles.screen}
            >
              {step.screen}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
