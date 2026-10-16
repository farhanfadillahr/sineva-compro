import { Button, type ActionLinkComponent } from '@/components/ui'
import { cx } from '@/components/ui/cx'
import { blogListHref, paginationItems } from './blog-query'

/**
 * Previous, numbered pages and Next, as plain links (`?page=2`, with the category kept). Renders
 * nothing for a single page: pagination that offers nowhere to go is noise.
 */
export function BlogPagination({
  label,
  previousLabel,
  nextLabel,
  pageLabel,
  category,
  page,
  totalPages,
  linkComponent,
}: {
  label: string
  previousLabel: string
  nextLabel: string
  /** Accessible name of a numbered link. */
  pageLabel: (page: number) => string
  category: string | null
  page: number
  totalPages: number
  linkComponent?: ActionLinkComponent
}) {
  if (totalPages <= 1) return null
  const href = (target: number) => blogListHref({ category, page: target })
  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {page > 1 ? (
          <li>
            <Button
              href={href(page - 1)}
              variant="secondary"
              rel="prev"
              linkComponent={linkComponent}
            >
              {previousLabel}
            </Button>
          </li>
        ) : null}
        {paginationItems(page, totalPages).map((item, index) =>
          item === 'gap' ? (
            <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-text-secondary">
              {'…'}
            </li>
          ) : (
            <li key={item}>
              {item === page ? (
                <span
                  aria-current="page"
                  className={cx(
                    'inline-flex h-11 min-w-11 items-center justify-center rounded-pill px-3',
                    'bg-surface-tint text-label text-text-brand',
                  )}
                >
                  {item}
                </span>
              ) : (
                <Button
                  href={href(item)}
                  variant="ghost"
                  aria-label={pageLabel(item)}
                  className="min-w-11 rounded-pill"
                  linkComponent={linkComponent}
                >
                  {item}
                </Button>
              )}
            </li>
          ),
        )}
        {page < totalPages ? (
          <li>
            <Button
              href={href(page + 1)}
              variant="secondary"
              rel="next"
              linkComponent={linkComponent}
            >
              {nextLabel}
            </Button>
          </li>
        ) : null}
      </ul>
    </nav>
  )
}
