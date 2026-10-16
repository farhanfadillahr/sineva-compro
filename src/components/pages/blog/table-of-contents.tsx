'use client'

import { useEffect, useRef, useState } from 'react'
import { cx, focusRing } from '@/components/ui/cx'
import type { TocHeading } from '@/components/content/rich-text-model'
import { pickActiveHeading } from './toc-active'

/**
 * Reading band for the active heading: it starts below the sticky header (the 96 px matches the
 * `scroll-pt-24` the layout sets for anchor targets) and ends two thirds down the viewport, so a
 * heading becomes current once it is in the upper part of the screen, not only when it touches
 * the top edge.
 */
const READING_BAND = '-96px 0px -66% 0px'

export type TableOfContentsProps = {
  /** Accessible name of the navigation. */
  label: string
  /** Visible title above the list. */
  title: string
  headings: readonly TocHeading[]
  className?: string
}

/**
 * Table of contents (h2 and h3 of the article). Every entry is a plain anchor, so it works by
 * keyboard and without JavaScript; the client part only highlights the heading being read, with
 * an IntersectionObserver instead of a scroll listener (no work per scroll frame).
 *
 * Without IntersectionObserver (very old browsers) the list simply has no highlight.
 */
export function TableOfContents({ label, title, headings, className }: TableOfContentsProps) {
  const [active, setActive] = useState<string | null>(null)
  const activeRef = useRef<string | null>(null)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const ids = headings.map((heading) => heading.id)
    const elements = ids.flatMap((id) => {
      const element = document.getElementById(id)
      return element ? [element] : []
    })
    if (elements.length === 0) return

    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        let aboveFirst = false
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else {
            visible.delete(entry.target.id)
            // The first heading leaving the band downwards means the reader is back above it.
            if (entry.target.id === ids[0] && entry.boundingClientRect.top > 0) aboveFirst = true
          }
        }
        const next =
          aboveFirst && visible.size === 0
            ? null
            : pickActiveHeading(visible, ids, activeRef.current)
        if (next !== activeRef.current) {
          activeRef.current = next
          setActive(next)
        }
      },
      { rootMargin: READING_BAND },
    )
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [headings])

  return (
    <nav aria-label={label} className={className}>
      <p className="mb-3 font-mono text-eyebrow uppercase text-text-secondary">{title}</p>
      <ol className="flex flex-col border-s border-border">
        {headings.map((heading) => (
          <li key={heading.id} data-level={heading.level} className="-ms-px data-[level='3']:ps-4">
            <a
              href={`#${heading.id}`}
              aria-current={active === heading.id ? 'location' : undefined}
              className={cx(
                'block border-s-2 border-transparent py-1.5 ps-4 pe-2 text-body-sm text-text-secondary',
                'hover:text-text aria-[current=location]:border-text-brand',
                'aria-[current=location]:font-medium aria-[current=location]:text-text-brand',
                'transition-colors duration-(--dur-fast) motion-reduce:transition-none',
                focusRing,
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
