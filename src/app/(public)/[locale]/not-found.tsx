import { getTranslations } from 'next-intl/server'

export default async function PublicNotFound() {
  const t = await getTranslations('NotFound')
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">404</h1>
      <p className="mt-4">{t('title')}</p>
    </main>
  )
}
