'use client'

import { useId, useState, type ReactNode } from 'react'
import { cx, focusRing } from '@/components/ui/cx'
import { Collapse } from './collapse'
import { ChevronDownIcon } from './icons'
import { FOOTER_ACCORDION_QUERY } from './media-queries'
import { useMediaQuery } from './use-media-query'

/**
 * One footer column. From 768 px it is a plain heading over a list; below, the heading becomes
 * an accordion button (components.md section 3).
 *
 * The collapsed look comes from CSS breakpoints (see Collapse `alwaysOpenAt`), so the server
 * markup is right at every width before hydration. Only the semantics wait for JS: the heading
 * turns into a button once the media query is known to match, and the collapsed list becomes
 * inert. Links are passed as children so they stay server-rendered.
 */
export function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const accordion = useMediaQuery(FOOTER_ACCORDION_QUERY)
  const id = useId()
  return (
    <section aria-labelledby={`${id}-title`} className="border-b border-border md:border-b-0">
      <h2 id={`${id}-title`} className="m-0 text-label font-semibold text-text">
        {accordion ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`${id}-list`}
            onClick={() => setOpen((value) => !value)}
            className={cx('flex min-h-14 w-full items-center justify-between text-left', focusRing)}
          >
            {title}
            <ChevronDownIcon
              className={cx(
                'size-5 transition-transform duration-300 ease-out motion-reduce:transition-none',
                open && 'rotate-180',
              )}
            />
          </button>
        ) : (
          <span className="flex min-h-14 items-center md:min-h-11">{title}</span>
        )}
      </h2>
      <Collapse open={open} id={`${id}-list`} alwaysOpenAt="md" inert={accordion && !open}>
        {children}
      </Collapse>
    </section>
  )
}
