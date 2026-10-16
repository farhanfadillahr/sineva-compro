/**
 * Small UI labels the Home page needs that the content DTOs do not carry. They are read from the
 * `Home` namespace of the messages when it exists, and every one is optional: a missing label
 * removes the thing it names (the badge) or falls back to a content string (the bar's landmark
 * name), so the page never shows a raw message key.
 */
export type HomeLabels = Readonly<{
  /** Accessible name of the mobile sticky CTA bar. */
  stickyBarLabel?: string
  /** Badge on the Product path card while the product is not live. */
  comingSoon?: string
  /** Badge on showcase cards (FR-PF-03): "Internal demo project". */
  internalDemo?: string
}>

const KEYS = ['stickyBarLabel', 'comingSoon', 'internalDemo'] as const

/** `messages` is whatever `getMessages()` returned; anything unexpected yields no labels. */
export function homeLabelsFromMessages(messages: unknown): HomeLabels {
  const namespace =
    typeof messages === 'object' && messages !== null
      ? (messages as Record<string, unknown>).Home
      : undefined
  if (typeof namespace !== 'object' || namespace === null) return {}
  const source = namespace as Record<string, unknown>
  const labels: { -readonly [K in keyof HomeLabels]?: string } = {}
  for (const key of KEYS) {
    const value = source[key]
    if (typeof value === 'string' && value !== '') labels[key] = value
  }
  return labels
}
