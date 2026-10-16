/**
 * UI strings the Services pages need that the content DTOs do not carry (section titles of the
 * detail page, breadcrumb, button templates). They come from the `Services` and `Pages`
 * namespaces of the messages.
 *
 * Unlike the Home labels these are all required: a detail page without "Problems we solve" would
 * render a section with no title. A missing key throws with its name, so the build fails and a
 * raw key never reaches a visitor.
 */
export type ServicesLabels = Readonly<{
  breadcrumbLabel: string
  homeCrumb: string
  servicesCrumb: string
  /** Accessible name of the mobile sticky CTA bar. */
  stickyBarLabel: string
  /** Label of a service card's CTA; the name keeps the link clear without its card around it. */
  cardCta: (name: string) => string
  chatOnWhatsapp: string
  /** Badge on showcase cards (FR-PF-03). */
  internalDemo: string
  detail: Readonly<{
    eyebrow: string
    problemsTitle: string
    deliverablesTitle: string
    processTitle: string
    toolsTitle: string
    relatedWorkTitle: string
    faqTitle: string
    finalCtaHeadline: string
    finalCtaBody: string
  }>
}>

const NAME_PLACEHOLDER = '{name}'

function read(messages: unknown, path: string): string {
  let node: unknown = messages
  for (const part of path.split('.')) {
    node =
      typeof node === 'object' && node !== null
        ? (node as Record<string, unknown>)[part]
        : undefined
  }
  if (typeof node !== 'string' || node === '') {
    throw new Error(`Missing message "${path}" needed by the Services pages`)
  }
  return node
}

/** `messages` is whatever `getMessages()` returned. */
export function servicesLabelsFromMessages(messages: unknown): ServicesLabels {
  const m = (key: string) => read(messages, `Services.${key}`)
  const cardCta = m('cardCta')
  return {
    breadcrumbLabel: m('breadcrumbLabel'),
    homeCrumb: read(messages, 'Pages.home'),
    servicesCrumb: read(messages, 'Pages.services'),
    stickyBarLabel: m('stickyBarLabel'),
    cardCta: (name) => cardCta.replaceAll(NAME_PLACEHOLDER, name),
    chatOnWhatsapp: m('chatOnWhatsapp'),
    internalDemo: m('internalDemo'),
    detail: {
      eyebrow: m('detail.eyebrow'),
      problemsTitle: m('detail.problemsTitle'),
      deliverablesTitle: m('detail.deliverablesTitle'),
      processTitle: m('detail.processTitle'),
      toolsTitle: m('detail.toolsTitle'),
      relatedWorkTitle: m('detail.relatedWorkTitle'),
      faqTitle: m('detail.faqTitle'),
      finalCtaHeadline: m('detail.finalCtaHeadline'),
      finalCtaBody: m('detail.finalCtaBody'),
    },
  }
}
