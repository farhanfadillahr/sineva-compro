'use client'
import { createContext, useContext, type ReactNode } from 'react'
import { FIELD_LIMITS } from '@/features/content/limits'
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
 * Google snippet and social card previews for a document's SEO fields. Meta titles in the content
 * already include the brand (" | Sineva"), so the template is applied only when it is missing,
 * which matches how the site builds titles.
 */
export function SeoPreview({ value }: { value: Record<string, unknown> }) {
  const settings = useContext(SeoPreviewContext)
  const raw = String(value.metaTitle ?? '')
  const title = raw.includes(settings.siteName)
    ? raw
    : settings.titleTemplate.replace('{title}', raw || 'Judul halaman')
  const description = String(value.metaDescription ?? '') || 'Deskripsi meta akan tampil di sini.'
  const host = settings.origin.replace(/^https?:\/\//, '')
  return (
    <div className={c.seoPreview} aria-label="Pratinjau hasil pencarian dan kartu sosial">
      <div className={c.snippet}>
        <p className={s.muted}>{host}</p>
        <p className={c.snippetTitle}>{cut(title, FIELD_LIMITS.metaTitleChars + 10)}</p>
        <p>{cut(description, FIELD_LIMITS.metaDescriptionChars)}</p>
      </div>
      <div className={c.ogCard}>
        <span className={s.muted}>
          {value.ogImage ? 'Gambar OG terpilih' : 'Kartu otomatis 1200 × 630'}
        </span>
        <strong>{raw || 'Judul halaman'}</strong>
        <span className={s.muted}>{settings.siteName}</span>
      </div>
    </div>
  )
}
