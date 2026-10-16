import 'server-only'
import { createStaticContentSource } from '../../content/static'
import type { PublicContentSource } from '../content/public'
import { faqReads } from '../faq/public.server'
import { pageReads } from '../pages/public.server'
import { postReads } from '../posts/public.server'
import { productReads } from '../product/public.server'
import { serviceReads } from '../services/public.server'
import { teamReads } from '../team/public.server'
import { settingsReads } from '../settings/public.server'

/**
 * The CMS database source. Each CMS feature contributes the reads it backs with tables; any read
 * not listed here stays on the static launch content, so the site keeps the same copy while the
 * CMS grows feature by feature. Add a feature's reads here, explicitly, when its tables ship.
 */
export function createDatabaseContentSource(): PublicContentSource {
  return {
    ...createStaticContentSource(),
    ...settingsReads,
    ...pageReads,
    ...productReads,
    ...faqReads,
    ...serviceReads,
    ...teamReads,
    ...postReads,
  }
}
