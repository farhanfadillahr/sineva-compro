import 'server-only'
import { db } from '../../lib/db/client.server'
import { cacheTags } from '../../lib/cache/tags'
import type { PublicContentSource } from '../content/public'
import type { ContentLocale, FaqItem, FaqTag, RichTextDocument } from '../content/types'
import { cachedRead } from '../cms/cache.server'
import { publicCollection } from '../collections/service.server'

/** Items carrying `tag`, in the library order. The DTO carries no tags or keys. */
async function listFaq(tag: FaqTag, locale: ContentLocale): Promise<readonly FaqItem[]> {
  return (await publicCollection(db, 'faq', locale))
    .filter(({ global }) => (global.tags as string[]).includes(tag))
    .map(({ local }) => ({
      question: local.question as string,
      answer: local.answer as RichTextDocument,
    }))
}

export const faqReads = {
  listFaq: cachedRead('faq', listFaq, (_tag, locale) => [cacheTags.faq(locale)]),
} satisfies Partial<PublicContentSource>

/** Tag choices for the current services, for the FAQ form. */
export async function serviceTagOptions(locale: ContentLocale) {
  const { getContentSource } = await import('../../lib/content-source')
  return (await getContentSource().listServices(locale)).map((service) => ({
    value: `service:${service.slug}`,
    label: `Layanan: ${service.title}`,
  }))
}
