/**
 * UI strings the Product page needs that the content DTOs do not carry: the waitlist form
 * controls and messages, the Coming soon badge and two accessible names. They live in the
 * `Product` namespace of the messages.
 *
 * Unlike the Home labels none of these is optional. A missing form label would render a control
 * with no name, and a missing message line would send a WhatsApp text with a hole in it, so the
 * reader throws and the problem shows up in the first test or build instead of in front of a
 * visitor. The messages ship with the repo, so this can only fail when someone edits them.
 */
export type ProductLabels = Readonly<{
  /** Badge near the hero while the product is not live. */
  comingSoon: string
  /** Accessible name of the mobile sticky CTA bar. */
  stickyBarLabel: string
  /** Accessible name of the business type tab list. */
  tabsLabel: string
  waitlist: Readonly<{
    formLabel: string
    nameLabel: string
    businessTypeLabel: string
    businessTypePlaceholder: string
    /** Consent sentence in three parts around the privacy link, so no markup is stored. */
    consentBefore: string
    consentLink: string
    consentAfter: string
    consentError: string
    helper: string
    emailButton: string
    /** Shown after submit, with a link to the same WhatsApp URL in case the pop-up was blocked. */
    openedMessage: string
    openedLink: string
    /** Lines of the message the visitor sends. */
    messageNotify: string
    messageName: string
    messageBusinessType: string
    emailSubject: string
  }>
}>

const TOP_KEYS = ['comingSoon', 'stickyBarLabel', 'tabsLabel'] as const
const WAITLIST_KEYS = [
  'formLabel',
  'nameLabel',
  'businessTypeLabel',
  'businessTypePlaceholder',
  'consentBefore',
  'consentLink',
  'consentAfter',
  'consentError',
  'helper',
  'emailButton',
  'openedMessage',
  'openedLink',
  'messageNotify',
  'messageName',
  'messageBusinessType',
  'emailSubject',
] as const

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`messages: "${path}" is missing`)
  }
  return value as Record<string, unknown>
}

function pick<K extends string>(
  source: Record<string, unknown>,
  keys: readonly K[],
  path: string,
): Record<K, string> {
  const out = {} as Record<K, string>
  for (const key of keys) {
    const value = source[key]
    if (typeof value !== 'string' || value === '') {
      throw new Error(`messages: "${path}.${key}" is missing`)
    }
    out[key] = value
  }
  return out
}

/** `messages` is whatever `getMessages()` returned. Throws when a label is missing. */
export function productLabelsFromMessages(messages: unknown): ProductLabels {
  const product = record(record(messages, 'messages').Product, 'Product')
  return {
    ...pick(product, TOP_KEYS, 'Product'),
    waitlist: pick(record(product.waitlist, 'Product.waitlist'), WAITLIST_KEYS, 'Product.waitlist'),
  }
}
