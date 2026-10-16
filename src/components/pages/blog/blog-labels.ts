/**
 * UI strings the Blog pages need that the content DTOs do not carry (filter, pagination, share
 * buttons, table of contents, article meta). They come from the `Blog` and `Pages` namespaces of
 * the messages.
 *
 * All required: a share button without its label would be an unnamed control. A missing key
 * throws with its name, so the build fails and a raw key never reaches a visitor.
 */
export type BlogLabels = Readonly<{
  breadcrumbLabel: string
  homeCrumb: string
  blogCrumb: string
  categoryFilterLabel: string
  allCategories: string
  latestBadge: string
  readArticle: string
  paginationLabel: string
  previousPage: string
  nextPage: string
  /** Accessible name of a numbered pagination link. */
  pageLink: (page: number) => string
  emptyTitle: string
  emptyCta: string
  article: Readonly<{
    byAuthor: (name: string) => string
    published: string
    updated: string
    tocTitle: string
    tocLabel: string
    shareTitle: string
    shareWhatsapp: string
    shareLinkedin: string
    copyLink: string
    linkCopied: string
    copyFailed: string
    relatedTitle: string
    finalCtaHeadline: string
    finalCtaBody: string
    finalCtaButton: string
    chatOnWhatsapp: string
  }>
}>

function read(messages: unknown, path: string): string {
  let node: unknown = messages
  for (const part of path.split('.')) {
    node =
      typeof node === 'object' && node !== null
        ? (node as Record<string, unknown>)[part]
        : undefined
  }
  if (typeof node !== 'string' || node === '') {
    throw new Error(`Missing message "${path}" needed by the Blog pages`)
  }
  return node
}

/** `messages` is whatever `getMessages()` returned. */
export function blogLabelsFromMessages(messages: unknown): BlogLabels {
  const m = (key: string) => read(messages, `Blog.${key}`)
  const a = (key: string) => read(messages, `Blog.article.${key}`)
  const pageLink = m('pageLink')
  const byAuthor = a('byAuthor')
  return {
    breadcrumbLabel: m('breadcrumbLabel'),
    homeCrumb: read(messages, 'Pages.home'),
    blogCrumb: read(messages, 'Pages.blog'),
    categoryFilterLabel: m('categoryFilterLabel'),
    allCategories: m('allCategories'),
    latestBadge: m('latestBadge'),
    readArticle: m('readArticle'),
    paginationLabel: m('paginationLabel'),
    previousPage: m('previousPage'),
    nextPage: m('nextPage'),
    pageLink: (page) => pageLink.replaceAll('{page}', String(page)),
    emptyTitle: m('emptyTitle'),
    emptyCta: m('emptyCta'),
    article: {
      byAuthor: (name) => byAuthor.replaceAll('{name}', name),
      published: a('published'),
      updated: a('updated'),
      tocTitle: a('tocTitle'),
      tocLabel: a('tocLabel'),
      shareTitle: a('shareTitle'),
      shareWhatsapp: a('shareWhatsapp'),
      shareLinkedin: a('shareLinkedin'),
      copyLink: a('copyLink'),
      linkCopied: a('linkCopied'),
      copyFailed: a('copyFailed'),
      relatedTitle: a('relatedTitle'),
      finalCtaHeadline: a('finalCtaHeadline'),
      finalCtaBody: a('finalCtaBody'),
      finalCtaButton: a('finalCtaButton'),
      chatOnWhatsapp: a('chatOnWhatsapp'),
    },
  }
}
