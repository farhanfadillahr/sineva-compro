import { routing } from '@/i18n/routing'

/**
 * Slot for the language switcher. The behaviour (jumping to the matching page of the other
 * locale) is a separate, deferred ticket; what this component guarantees today is that the layout
 * shows nothing while only one locale is enabled, so no dead control ever ships. Adding a locale
 * to `routing.locales` is what makes the slot appear.
 */
export function LanguageSwitcher({ locales = routing.locales }: { locales?: readonly string[] }) {
  if (locales.length <= 1) return null
  return <div data-slot="language-switcher" />
}
