'use client'

import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { Card } from '@/components/ui'
import { cx, focusRing } from '@/components/ui/cx'
import type { Industry } from '@/features/content/types'

export type IndustryTabsProps = {
  /** Accessible name of the tab list. */
  label: string
  items: readonly Industry[]
}

/**
 * Segmented control over the business types (components.md section 8), as the ARIA tabs pattern
 * with automatic activation: arrow keys move focus and selection together, Home and End jump to
 * the ends, and only the selected tab is in the tab order (roving tabindex).
 *
 * Every panel stays in the document and the inactive ones are `hidden`: each tab can point at its
 * panel with `aria-controls`, and the text of all example days is in the server HTML. The panel
 * itself is focusable so Tab from the tab list lands on the content instead of skipping it.
 *
 * The sliding indicator is a sibling element moved with `translateX`, not a background on the
 * active tab. The segments are equal-width grid cells, so the offset is a plain multiple of the
 * indicator width and needs no measuring (no layout effect, no flash on hydration).
 */
export function IndustryTabs({ label, items }: IndustryTabsProps) {
  const baseId = useId()
  const [active, setActive] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const count = items.length
  if (count === 0) return null

  const tabId = (index: number) => `${baseId}-tab-${index}`
  const panelId = (index: number) => `${baseId}-panel-${index}`

  function select(index: number) {
    setActive(index)
    tabRefs.current[index]?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const target =
      event.key === 'ArrowRight'
        ? (index + 1) % count
        : event.key === 'ArrowLeft'
          ? (index - 1 + count) % count
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? count - 1
              : null
    if (target === null) return
    event.preventDefault()
    select(target)
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div
        role="tablist"
        aria-label={label}
        className="relative grid w-full max-w-xl auto-cols-fr grid-flow-col rounded-pill bg-canvas-alt p-1"
      >
        <span
          aria-hidden="true"
          data-slot="tab-indicator"
          className="absolute inset-y-1 left-1 rounded-pill bg-surface shadow-xs transition-transform duration-(--dur-base) ease-out motion-reduce:transition-none"
          style={{
            width: `calc((100% - 0.5rem) / ${count})`,
            transform: `translateX(${active * 100}%)`,
          }}
        />
        {items.map((item, index) => {
          const selected = index === active
          return (
            <button
              key={item.key}
              ref={(el) => {
                tabRefs.current[index] = el
              }}
              type="button"
              role="tab"
              id={tabId(index)}
              aria-selected={selected}
              aria-controls={panelId(index)}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cx(
                'relative z-10 min-h-11 rounded-pill px-2 py-2 text-label text-balance sm:px-4',
                'transition-colors duration-(--dur-base) ease-out motion-reduce:transition-none',
                selected ? 'text-text' : 'text-text-secondary hover:text-text',
                focusRing,
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      {items.map((item, index) => (
        <div
          key={item.key}
          role="tabpanel"
          id={panelId(index)}
          aria-labelledby={tabId(index)}
          tabIndex={0}
          hidden={index !== active}
          className={cx('w-full max-w-2xl rounded-xl', focusRing)}
        >
          <Card variant="base" className="text-center">
            <p className="text-lead text-pretty text-text">{item.exampleDay}</p>
          </Card>
        </div>
      ))}
    </div>
  )
}
