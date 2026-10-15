import * as rootParams from 'next/root-params'
import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { routing } from './routing'

// Only the active locales are bundled. The Indonesian source text lives in
// docs/content/messages-id.json and moves to messages/id.json when `id` is enabled.
const dictionaries = {
  en: () => import('../../messages/en.json').then((module) => module.default),
}
export default getRequestConfig(async () => {
  const locale = await rootParams.locale()
  if (!hasLocale(routing.locales, locale)) notFound()
  return {
    locale,
    messages: await dictionaries[locale](),
    onError() {
      console.error('Localized message unavailable.')
    },
    getMessageFallback() {
      return 'Content unavailable.'
    },
  }
})
