import { Chip, type ActionLinkComponent } from '@/components/ui'
import type { Category } from '@/features/content/types'
import { blogListHref } from './blog-query'

/**
 * `chip-filter` row (components.md section 5). Each chip is a link to its own URL
 * (`/blog?category=...`), not a button that filters in place: the filter works without
 * JavaScript, the server renders the right list for it, and a filtered view can be shared.
 * The selected chip carries `aria-current`.
 */
export function CategoryFilter({
  label,
  allLabel,
  categories,
  active,
  linkComponent,
}: {
  label: string
  allLabel: string
  categories: readonly Category[]
  /** Slug of the selected category, `null` for "All". */
  active: string | null
  linkComponent?: ActionLinkComponent
}) {
  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap gap-2">
        <li>
          <Chip href={blogListHref({})} selected={active === null} linkComponent={linkComponent}>
            {allLabel}
          </Chip>
        </li>
        {categories.map((category) => (
          <li key={category.slug}>
            <Chip
              href={blogListHref({ category: category.slug })}
              selected={active === category.slug}
              linkComponent={linkComponent}
            >
              {category.name}
            </Chip>
          </li>
        ))}
      </ul>
    </nav>
  )
}
