import Image from 'next/image'
import { Badge, Card, type ActionLinkComponent } from '@/components/ui'
import type { WorkSummary } from '@/features/content/types'
import { CardLink } from './card-link'

const MAX_STACK_TAGS = 3

/**
 * `card-work` (components.md section 4): 16:10 cover in a nested radius, the "Internal demo
 * project" badge on showcase items (FR-PF-03, also on Home), title, one-line summary and the
 * tools used. The whole card links to the work detail page.
 */
export function WorkCard({
  item,
  internalDemoLabel,
  linkComponent,
}: {
  item: WorkSummary
  internalDemoLabel?: string
  linkComponent?: ActionLinkComponent
}) {
  const { cover } = item
  return (
    <Card as="article" variant="work" interactive className="relative w-full">
      <div className="p-2">
        <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-surface-tint">
          {cover ? (
            <Image
              src={cover.url}
              width={cover.width}
              height={cover.height}
              alt={cover.alt}
              sizes="(min-width: 1024px) 30vw, (min-width: 768px) 33vw, 90vw"
              placeholder={cover.blurDataUrl ? 'blur' : 'empty'}
              blurDataURL={cover.blurDataUrl ?? undefined}
              className="size-full object-cover transition-transform duration-(--dur-med) ease-out group-hover/card:scale-[1.03] motion-reduce:transition-none"
            />
          ) : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col items-start gap-3 p-6 pt-4">
        {item.projectType === 'internal-demo' && internalDemoLabel ? (
          <Badge tone="warm">{internalDemoLabel}</Badge>
        ) : null}
        <h3 className="text-h4 text-balance text-text">
          <CardLink href={`/work/${item.slug}`} linkComponent={linkComponent}>
            {item.title}
          </CardLink>
        </h3>
        <p className="text-body-sm text-pretty text-text-secondary">{item.summary}</p>
        {item.stack.length > 0 ? (
          <ul className="mt-auto flex flex-wrap gap-2 pt-2">
            {item.stack.slice(0, MAX_STACK_TAGS).map((tool) => (
              <li key={tool}>
                <Badge tone="neutral">{tool}</Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Card>
  )
}
