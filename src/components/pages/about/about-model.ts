import { FINAL_CTA_TONE } from '@/components/sections/final-cta'
import { planTones, type PlannedSection } from '@/components/pages/services/plan-tones'
import type { PublicContentSource } from '@/features/content/public'
import type {
  AboutPageContent,
  ContentLocale,
  PoseKey,
  RichTextDocument,
  RichTextNode,
  SiteSettingsDTO,
  TeamMember,
} from '@/features/content/types'

export const ABOUT_HREFS = {
  about: '/about',
  contact: '/contact',
  /** Target of the final CTA's optional second action, whose label the content owns. */
  product: '/products/ai-agents',
} as const

/**
 * Art direction per section. The content carries the hero scene as media, but the scene (C3) is
 * not produced yet, so the hero falls back to S13. Meet Sino and the final CTA each get their own
 * pose, so one picture is never repeated down the page. Wave (S1) is the closing CTA's pose
 * (page-patterns.md 2.1 row 10); the Meet Sino pose is not the hero's.
 */
export const ABOUT_POSES = {
  hero: 'relaxed-mug',
  meetSino: 'holding-phone',
  finalCta: 'wave',
} as const satisfies Record<string, PoseKey>

export type AboutModel = Readonly<{
  locale: ContentLocale
  page: AboutPageContent
  /** `null` when settings do not exist for the locale: the team reads as off, no WhatsApp. */
  settings: SiteSettingsDTO | null
  /** Empty while either team toggle is off, or when nobody agreed to be listed. */
  team: readonly TeamMember[]
}>

/** The team needs both the page toggle and the site setting (the plan checks it again). */
const teamAllowed = (page: AboutPageContent, settings: SiteSettingsDTO | null): boolean =>
  page.team.visible && settings?.features.showTeam === true

/**
 * Everything the About page renders, through the public content contract only. Resolves to
 * `null` when the page has no content for the locale (the page then answers 404).
 *
 * The team is not even queried when its toggle is off.
 */
export async function loadAboutModel(
  source: PublicContentSource,
  locale: ContentLocale,
): Promise<AboutModel | null> {
  const [page, settings] = await Promise.all([
    source.getPage('about', locale),
    source.getSiteSettings(locale),
  ])
  if (!page) return null

  const team = teamAllowed(page, settings) ? await source.listTeam(locale) : []
  return { locale, page, settings, team }
}

export type AboutSectionId =
  'hero' | 'story' | 'mission' | 'values' | 'meetSino' | 'team' | 'finalCta'

/** Tones of page-patterns.md 2.7: hero A, then canvas and tint alternating, team ALT, final CTA I. */
export function planAboutSections(model: AboutModel): readonly PlannedSection<AboutSectionId>[] {
  const { page, settings } = model
  return planTones<AboutSectionId>([
    { id: 'hero', visible: true, preferred: 'aurora', fixed: true },
    { id: 'story', visible: storyBlocks(page.story).length > 0, preferred: 'canvas' },
    { id: 'mission', visible: true, preferred: 'tint' },
    { id: 'values', visible: page.values.items.length > 0, preferred: 'canvas' },
    { id: 'meetSino', visible: true, preferred: 'tint' },
    {
      id: 'team',
      // Checked again here: the plan is the one place that decides what renders.
      visible: teamAllowed(page, settings) && model.team.length > 0,
      preferred: 'alt',
    },
    { id: 'finalCta', visible: true, preferred: FINAL_CTA_TONE, fixed: true },
  ])
}

// ---------------------------------------------------------------------------------------------
// Story
// ---------------------------------------------------------------------------------------------

export type StoryBlock =
  | Readonly<{ kind: 'heading'; text: string; level: number }>
  | Readonly<{ kind: 'paragraph'; text: string }>

function textOf(node: RichTextNode): string {
  if (node.type === 'text') return node.text ?? ''
  const children = node.content ?? []
  // A run of inline nodes (text with marks) must be glued; block children are separated.
  const glue = children.every((child) => child.type === 'text' || child.type === 'hardBreak')
    ? ''
    : ' '
  return children.map(textOf).join(glue)
}

const clean = (text: string) => text.replace(/\s+/g, ' ').trim()

/**
 * The story as plain blocks: headings and paragraphs of text, nothing else.
 *
 * Why not render the rich text document: the content layer says rich text goes through one
 * shared renderer, and none exists yet (the FAQ keeps a private minimal one). The story is
 * written as headings and paragraphs, so flattening to those covers it without a second renderer
 * to keep in step. Marks and links are dropped, which is also the safe default for an href that
 * comes from content. Lists and unknown nodes degrade to one paragraph per item or node. Replace
 * this with the shared renderer when it lands.
 */
export function storyBlocks(document: RichTextDocument): readonly StoryBlock[] {
  const blocks: StoryBlock[] = []
  const push = (node: RichTextNode) => {
    if (node.type === 'bulletList' || node.type === 'orderedList') {
      for (const item of node.content ?? []) push(item)
      return
    }
    const text = clean(textOf(node))
    if (text === '') return
    if (node.type === 'heading') {
      const level = typeof node.attrs?.level === 'number' ? node.attrs.level : 2
      blocks.push({ kind: 'heading', text, level })
    } else {
      blocks.push({ kind: 'paragraph', text })
    }
  }
  for (const node of document.content) push(node)
  return blocks
}
