import { routing } from '../../src/i18n/routing'
import { DEFAULT_TEMPLATES } from '../../src/features/email/defaults'
import { EMAIL_TEMPLATE_KEYS } from '../../src/features/email/render'
import { emailTemplate } from '../../src/features/email/schema'
import type { SeedModule } from './types'

/**
 * Base: the template keys with their starting copy for the default locale, inserted when missing.
 * No settings row is seeded (no secret or sender is invented), and there are no demo rows.
 */
export const emailSeed: SeedModule = {
  key: 'email',
  async base(tx) {
    for (const key of EMAIL_TEMPLATE_KEYS)
      await tx
        .insert(emailTemplate)
        .values({ key, locale: routing.defaultLocale, ...DEFAULT_TEMPLATES[key] })
        .onConflictDoNothing()
  },
  async demo() {},
  async purgeDemo() {},
}
