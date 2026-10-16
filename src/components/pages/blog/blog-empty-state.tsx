import { Button, type ActionLinkComponent } from '@/components/ui'
import { PoseImage } from '../home/pose-image'

/**
 * Empty state (components.md section 11): Sino relaxed with a mug (S13), a headline, the text
 * from the Blog page content and one call to action. The pose is decorative, so it has no alt
 * text: the text beside it carries the meaning.
 */
export function BlogEmptyState({
  title,
  body,
  ctaLabel,
  ctaHref,
  linkComponent,
}: {
  title: string
  body: string
  ctaLabel: string
  ctaHref: string
  linkComponent?: ActionLinkComponent
}) {
  return (
    <div
      data-blog-empty=""
      className="flex flex-col items-center gap-4 rounded-xl bg-canvas-alt px-6 py-12 text-center"
    >
      <PoseImage pose="relaxed-mug" sizes="160px" className="w-40" />
      <h2 className="text-h3 text-balance text-text">{title}</h2>
      <p className="max-w-[52ch] text-lead text-pretty text-text-secondary">{body}</p>
      <Button href={ctaHref} linkComponent={linkComponent} withArrow className="mt-2">
        {ctaLabel}
      </Button>
    </div>
  )
}
