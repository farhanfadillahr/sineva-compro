'use client'

import {
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cx, focusRing } from '@/components/ui/cx'
import { PlusGlyph } from './icons'
import styles from './faq-accordion.module.css'

const noopSubscribe = () => () => {}

type AccordionItem = Readonly<{ question: string; answer: ReactNode }>

/**
 * The accordion list of the FAQ block (components.md section 7). Each question is a
 * `<button aria-expanded aria-controls>` inside a heading, each answer a labelled region. All
 * items start closed and any number can be open at once. Arrow keys, Home and End move focus
 * between the questions (the optional APG accordion keys); Enter and Space are the native button
 * behaviour.
 *
 * Gotcha: closed answers get `inert` only after hydration. Rendering `inert` on the server would
 * take the answers away from visitors without JavaScript, who get every answer expanded through
 * the `scripting: none` rule in the CSS module instead.
 */
export function FaqAccordion({ items }: { items: readonly AccordionItem[] }) {
  const baseId = useId()
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set())
  // False in the server HTML and during hydration, true afterwards: the standard "has the client
  // taken over" signal, without a setState in an effect.
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )
  const triggers = useRef<(HTMLButtonElement | null)[]>([])

  const toggle = (index: number) =>
    setOpen((current) => {
      const next = new Set(current)
      if (!next.delete(index)) next.add(index)
      return next
    })

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = items.length - 1
    const target =
      event.key === 'ArrowDown'
        ? index === last
          ? 0
          : index + 1
        : event.key === 'ArrowUp'
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
    triggers.current[target]?.focus()
  }

  return (
    <div data-slot="faq-accordion" className="flex flex-col">
      {items.map((item, index) => {
        const isOpen = open.has(index)
        const buttonId = `${baseId}-q${index}`
        const panelId = `${baseId}-a${index}`
        return (
          <div key={index} className="border-b border-border-strong first:border-t">
            <h3>
              <button
                ref={(el) => {
                  triggers.current[index] = el
                }}
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
                onKeyDown={(event) => onKeyDown(event, index)}
                className={cx(
                  styles.trigger,
                  'flex min-h-11 w-full cursor-pointer items-center justify-between gap-4 py-5 text-start',
                  'text-lead font-semibold text-text transition-colors duration-(--dur-fast) ease-out',
                  'hover:bg-canvas-alt motion-reduce:transition-none',
                  focusRing,
                )}
              >
                <span>{item.question}</span>
                <PlusGlyph className={cx(styles.icon, 'size-6 text-text-brand')} />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              data-open={isOpen}
              inert={hydrated && !isOpen}
              className={styles.panel}
            >
              <div className={styles.panelInner}>
                <div className="pb-5 text-body text-pretty text-text-secondary">{item.answer}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
