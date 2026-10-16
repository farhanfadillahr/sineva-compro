import * as rootParams from 'next/root-params'
import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { routing } from './routing'

// One dictionary per enabled locale; tests keep their keys identical (CPR-101).
const dictionaries = {
  en: () => import('../../messages/en.json').then((module) => module.default),
  id: () => import('../../messages/id.json').then((module) => module.default),
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
