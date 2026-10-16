import { Container, type ActionLinkComponent } from '@/components/ui'
import { focusRing } from '@/components/ui/cx'

export type BreadcrumbItem = Readonly<{ label: string; href: string }>

/**
 * Breadcrumb trail (admin-ui.md section on the top bar uses the same markup contract): a named
 * `nav` with an ordered list, and `aria-current="page"` on the last item, which is not a link.
 * The `/` separators are CSS pseudo-content, so a screen reader announces the list ("list, 3
 * items") and never a stray slash. The structured-data twin of this trail is built by the page
 * from the same items.
 */
export function Breadcrumb({
  label,
  items,
  current,
  linkComponent: LinkComponent,
}: {
  label: string
  items: readonly BreadcrumbItem[]
  /** The page itself: shown as plain text, last in the trail. */
  current: string
  linkComponent?: ActionLinkComponent
}) {
  const linkClass = `rounded-xs underline-offset-4 hover:text-text hover:underline ${focusRing}`
  return (
    <div className="bg-canvas pt-4">
      <Container size="wide">
        <nav aria-label={label}>
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body-sm text-text-secondary">
            {items.map((item) => (
              <li
                key={item.href}
                className="flex items-center gap-2 after:text-text-tertiary after:content-['/']"
              >
                {LinkComponent ? (
                  <LinkComponent href={item.href as never} className={linkClass}>
                    {item.label}
                  </LinkComponent>
                ) : (
                  <a href={item.href} className={linkClass}>
                    {item.label}
                  </a>
                )}
              </li>
            ))}
            <li>
              <span aria-current="page" className="text-text">
                {current}
              </span>
            </li>
          </ol>
        </nav>
      </Container>
    </div>
  )
}
