import type { PublicContentSource } from '@/features/content/public'
import type {
  ContactPageContent,
  ContentLocale,
  SiteSettingsDTO,
  ThankYouPageContent,
} from '@/features/content/types'

export type ContactModel = Readonly<{
  locale: ContentLocale
  page: ContactPageContent
  /** `null` without settings for the locale: no WhatsApp, no email, no hours, no address. */
  settings: SiteSettingsDTO | null
}>

export type ThankYouModel = Readonly<{
  locale: ContentLocale
  page: ThankYouPageContent
  settings: SiteSettingsDTO | null
}>

/**
 * Everything /contact renders, through the public content contract only. Resolves to `null` when
 * the page has no content for the locale (the route then answers 404). Settings are an optional
 * extra: without them the page still renders, minus every control that needs them.
 */
export async function loadContactModel(
  source: PublicContentSource,
  locale: ContentLocale,
): Promise<ContactModel | null> {
  const [page, settings] = await Promise.all([
    source.getPage('contact', locale),
    source.getSiteSettings(locale),
  ])
  return page ? { locale, page, settings } : null
}

export async function loadThankYouModel(
  source: PublicContentSource,
  locale: ContentLocale,
): Promise<ThankYouModel | null> {
  const [page, settings] = await Promise.all([
    source.getPage('thankYou', locale),
    source.getSiteSettings(locale),
  ])
  return page ? { locale, page, settings } : null
}
