import 'server-only'
import { routing } from '../../i18n/routing'
import { CmsError } from '../cms/errors'
import { db } from '../../lib/db/client.server'
import type { ProductLaunchStatus } from '../content/types'
import { readPage, savePage } from '../pages/service.server'
import { launchPage } from '../pages/launch'

const STATUSES: readonly ProductLaunchStatus[] = ['coming_soon', 'live']

/** The product status lives in the Product page document and is read by Home and Product. */
export async function readProductStatus(): Promise<ProductLaunchStatus> {
  const locale = routing.defaultLocale
  const data = (await readPage(db, 'product', locale))?.data ?? launchPage('product', locale)
  return (data?.productStatus as ProductLaunchStatus | undefined) ?? 'coming_soon'
}

/** Switches the status for every locale at once, so the site never shows two states. */
export async function saveProductStatus(headers: Headers, status: unknown): Promise<void> {
  if (!STATUSES.includes(status as ProductLaunchStatus))
    throw new CmsError('INVALID', 'Status produk tidak valid.')
  for (const locale of routing.locales)
    await savePage(headers, 'product', { locale, data: { productStatus: status } }, [
      'productStatus',
    ])
}
