import { Reveal } from '@/components/motion/Reveal'
import {
  Container,
  Section,
  SectionHeader,
  type ActionLinkComponent,
  type SectionTone,
} from '@/components/ui'
import type { PostSummary, WorkSummary } from '@/features/content/types'
import { PostCard } from './post-card'
import { WorkCard } from './work-card'

type Common = { title: string; tone: SectionTone; linkComponent?: ActionLinkComponent }

// Three columns from md up; a single item still gets a column of its own instead of stretching.
const GRID = 'grid grid-cols-1 gap-4 md:grid-cols-3'

/** "Selected work" (page-patterns.md 2.1 row 7). The page only renders it with items. */
export function SelectedWorkSection({
  title,
  intro,
  items,
  tone,
  internalDemoLabel,
  linkComponent,
}: Common & {
  intro: string | null
  items: readonly WorkSummary[]
  internalDemoLabel?: string
}) {
  if (items.length === 0) return null
  return (
    <Section tone={tone}>
      <Container className="flex flex-col gap-12">
        <Reveal variant="lines">
          <SectionHeader title={title} lead={intro} />
        </Reveal>
        <ul className={GRID}>
          {items.map((item) => (
            <Reveal as="li" variant="depth" key={item.slug} className="flex">
              <WorkCard
                item={item}
                internalDemoLabel={internalDemoLabel}
                linkComponent={linkComponent}
              />
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  )
}

/** "From the blog" (page-patterns.md 2.1 row 8). The page only renders it with posts. */
export function BlogSection({
  title,
  posts,
  locale,
  tone,
  linkComponent,
}: Common & { posts: readonly PostSummary[]; locale: string }) {
  if (posts.length === 0) return null
  return (
    <Section tone={tone}>
      <Container className="flex flex-col gap-12">
        <Reveal variant="lines">
          <SectionHeader title={title} />
        </Reveal>
        <ul className={GRID}>
          {posts.map((post) => (
            <Reveal as="li" variant="depth" key={post.slug} className="flex">
              <PostCard post={post} locale={locale} linkComponent={linkComponent} />
            </Reveal>
          ))}
        </ul>
      </Container>
    </Section>
  )
}
