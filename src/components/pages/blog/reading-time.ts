import type { RichTextDocument } from '@/features/content/types'
import { richTextWordCount } from '@/components/content/rich-text-model'

/** Average adult reading speed for online text. */
export const WORDS_PER_MINUTE = 200

/**
 * Minutes to read an article: words divided by 200, rounded up, never below 1. Rounding up means
 * a short article shows "1 min" rather than "0 min", and 201 words is honestly "2 min". The same
 * formula runs where an article is saved, so a card (which only has the stored number) and the
 * article page (which counts the body) agree.
 */
export function estimateReadingMinutes(body: RichTextDocument): number {
  return Math.max(1, Math.ceil(richTextWordCount(body) / WORDS_PER_MINUTE))
}
