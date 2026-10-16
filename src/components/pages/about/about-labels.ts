/**
 * UI strings the About page needs that the content DTOs do not carry. Only the WhatsApp action's
 * label, which the header already has in the `Nav` namespace, so no namespace of its own exists.
 * It is optional: a missing label removes the action instead of showing a raw message key.
 */
export type AboutLabels = Readonly<{
  chatOnWhatsapp?: string
}>

/** `messages` is whatever `getMessages()` returned; anything unexpected yields no labels. */
export function aboutLabelsFromMessages(messages: unknown): AboutLabels {
  const nav =
    typeof messages === 'object' && messages !== null
      ? (messages as Record<string, unknown>).Nav
      : undefined
  const value =
    typeof nav === 'object' && nav !== null
      ? (nav as Record<string, unknown>).chatOnWhatsapp
      : undefined
  return typeof value === 'string' && value !== '' ? { chatOnWhatsapp: value } : {}
}
