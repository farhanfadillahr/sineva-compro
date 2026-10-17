'use client'
import { createContext, useContext, type ReactNode } from 'react'
import { FIELD_LIMITS } from '@/features/content/limits'
import { applyTitleTemplate } from '@/lib/site-metadata'
import s from '../admin.module.css'
import c from './cms.module.css'

export type SeoPreviewSettings = { titleTemplate: string; origin: string; siteName: string }

/** Title template and site origin for the snippet preview, provided once by the admin layout. */
export const SeoPreviewContext = createContext<SeoPreviewSettings>({
  titleTemplate: '{title} | Sineva',
  origin: 'https://sineva.id',
  siteName: 'Sineva',
})

export function SeoPreviewProvider({
  value,
  children,
}: {
  value: SeoPreviewSettings
  children: ReactNode
}) {
  return <SeoPreviewContext value={value}>{children}</SeoPreviewContext>
}

const cut = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text)

/**
 * Google snippet and social card previews for a document's SEO fields. The title goes through the
 * same template as the site (`applyTitleTemplate`), so the preview is what search and social show.
 */
export function SeoPreview({ value }: { value: Record<string, unknown> }) {
  const settings = useContext(SeoPreviewContext)
  const raw = String(value.metaTitle ?? '')
  const title = applyTitleTemplate(raw || 'Judul halaman', settings.titleTemplate)
  const description = String(value.metaDescription ?? '') || 'Deskripsi meta akan tampil di sini.'
  const host = settings.origin.replace(/^https?:\/\//, '')
  return (
    <div className={c.seoPreview} aria-label="Pratinjau hasil pencarian dan kartu sosial">
      <div className={c.snippet}>
        <p className={s.muted}>{host}</p>
        <p className={c.snippetTitle}>{cut(title, FIELD_LIMITS.metaTitleChars + 10)}</p>
        {/* The limit follows the Admin's title template: the brand is added there, not typed here.
            Google truncates long titles rather than rejecting them, so this warns, not blocks. */}
        {raw && title.length > FIELD_LIMITS.metaTitleChars ? (
          <p className={s.warning} role="status">
            Judul di hasil pencarian {title.length} karakter, lebih dari{' '}
            {FIELD_LIMITS.metaTitleChars}. Google bisa memotongnya; persingkat judul meta.
          </p>
        ) : null}
        <p>{cut(description, FIELD_LIMITS.metaDescriptionChars)}</p>
      </div>
      <div className={c.ogCard}>
        <span className={s.muted}>
          {value.ogImage ? 'Gambar OG terpilih' : 'Kartu otomatis 1200 × 630'}
        </span>
        <strong>{title}</strong>
        <span className={s.muted}>{settings.siteName}</span>
      </div>
    </div>
  )
}
