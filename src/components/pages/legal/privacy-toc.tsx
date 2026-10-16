import { cx, focusRing } from '@/components/ui/cx'
import type { OutlineHeading } from './privacy-outline'

type PrivacyTocProps = Readonly<{
  headings: readonly OutlineHeading[]
  /** Accessible name and visible label of the navigation. */
  label: string
  /** Grid placement from the page layout; the sticky behaviour lives here. */
  className?: string
}>

// Indent per heading level below the first, in the same step as the list padding.
const INDENT = ['', 'ps-4', 'ps-8', 'ps-12'] as const

/**
 * "On this page" (page-patterns.md 2.9). Plain in-page links: they work by keyboard with no
 * script, and a browser focuses the target on activation, so a screen reader announces the section.
 *
 * Why the wrapper is the sticky element and not the `<nav>`: sticky positioning only holds inside
 * its containing block, and the wrapper is the grid item that spans the whole article. The
 * `lg:` prefix keeps it in the normal flow below 1024 px, where a sticky box would cover the text
 * on a phone. `max-h` plus scroll keeps a long list reachable on a short desktop window.
 */
export function PrivacyToc({ headings, label, className }: PrivacyTocProps) {
  if (headings.length === 0) return null
  const topLevel = headings[0]!.level
  return (
    <div
      data-slot="privacy-toc"
      className={cx(
        'lg:sticky lg:top-28 lg:max-h-[calc(100svh-8rem)] lg:self-start lg:overflow-y-auto',
        className,
      )}
    >
      <nav
        id="privacy-toc"
        aria-labelledby="privacy-toc-label"
        className="rounded-lg border border-border bg-surface p-5 lg:border-0 lg:bg-transparent lg:p-0"
      >
        <p id="privacy-toc-label" className="text-eyebrow font-mono tracking-wide uppercase">
          {label}
        </p>
        <ol className="mt-3 flex flex-col">
          {headings.map((heading) => (
            <li key={heading.id} className={INDENT[Math.min(heading.level - topLevel, 3)]}>
              <a
                href={`#${heading.id}`}
                className={cx(
                  'block rounded-xs py-1.5 text-label text-text-secondary underline-offset-4',
                  'hover:text-text hover:underline',
                  focusRing,
                )}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  )
}
