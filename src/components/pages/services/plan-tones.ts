import type { SectionTone } from '@/components/ui'

export type PlannedSection<Id extends string> = Readonly<{ id: Id; tone: SectionTone }>

type Candidate<Id extends string> = Readonly<{
  id: Id
  visible: boolean
  preferred: SectionTone
  /** The block owns its tone (hero is always aurora, the final CTA a canvas band around an inverse panel). */
  fixed?: boolean
}>

/**
 * The sections that will render, in order, each with the tone it must be given.
 *
 * Tones are assigned after the visible list is known: a section that would repeat the non-white
 * tone of its visible predecessor falls back to canvas (white), which can never clash. Assigning
 * tones first and dropping sections afterwards is what leaves two `alt` bands side by side.
 */
export function planTones<Id extends string>(
  candidates: readonly Candidate<Id>[],
): readonly PlannedSection<Id>[] {
  const plan: PlannedSection<Id>[] = []
  for (const { id, visible, preferred, fixed = false } of candidates) {
    if (!visible) continue
    let tone = preferred
    if (!fixed && tone !== 'canvas' && plan.at(-1)?.tone === tone) tone = 'canvas'
    plan.push({ id, tone })
  }
  return plan
}
