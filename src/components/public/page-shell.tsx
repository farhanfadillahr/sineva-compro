import { getTranslations } from 'next-intl/server'
import { MAIN_CONTENT_ID } from '@/components/layout/skip-link'
import type messages from '../../../messages/en.json'

export type PublicPageKey = keyof typeof messages.Pages
export async function PublicPageShell({ page }: { page: PublicPageKey }) {
  const [brand, titles, status] = await Promise.all([
    getTranslations('Brand'),
    getTranslations('Pages'),
    getTranslations('Status'),
  ])
  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1} className="mx-auto max-w-3xl px-6 py-16 outline-none">
      <p className="eyebrow">{brand('name')}</p>
      <h1 className="text-3xl font-semibold">{titles(page)}</h1>
      <p className="muted mt-4">{status('pending')}</p>
    </main>
  )
}
