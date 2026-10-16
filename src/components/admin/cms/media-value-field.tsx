'use client'
import { useEffect, useId, useState } from 'react'
import type { MediaValue } from '@/features/cms/fields'
import type { MediaItem } from '@/features/media/types'
import { MediaPicker } from '../media/picker'
import { AdminButton } from '../primitives'
import s from '../admin.module.css'
import c from './cms.module.css'

/** Media field for CMS forms: a library image, a launch file from `public/`, or nothing. */
export function MediaValueField({
  label,
  hint,
  value,
  error,
  onChange,
}: {
  label: string
  hint?: string
  value: MediaValue
  error?: string
  onChange: (value: MediaValue) => void
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [item, setItem] = useState<MediaItem | null>(null)
  const [loadError, setLoadError] = useState('')
  const mediaId = value?.kind === 'media' ? value.id : null
  useEffect(() => {
    if (!mediaId || item?.id === mediaId) return
    const controller = new AbortController()
    fetch(`/admin/media/api/${mediaId}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error()
        setItem((await response.json()) as MediaItem)
        setLoadError('')
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError('Detail media belum dapat dimuat.')
      })
    return () => controller.abort()
  }, [mediaId, item?.id])
  const preview =
    value?.kind === 'static'
      ? { src: value.url, alt: value.alt, name: value.url.split('/').pop() ?? value.url }
      : value?.kind === 'media' && item?.id === value.id
        ? {
            src: item.previewUrl,
            alt: item.translations.en?.alt ?? '',
            name: item.filename,
          }
        : null
  return (
    <fieldset className={c.mediaField} aria-describedby={`${id}-hint`}>
      <legend>{label}</legend>
      {preview ? (
        <div className={c.mediaPreview}>
          {/* Admin preview of a private or static file; next/image would need every origin. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview.src} alt={preview.alt} />
          <div>
            <p className={s.mono}>{preview.name}</p>
            <p className={s.muted}>
              {value?.kind === 'static' ? 'File bawaan situs' : 'Dari pustaka media'}
              {preview.alt ? ` · Alt: ${preview.alt}` : ' · Alt belum diisi'}
            </p>
          </div>
        </div>
      ) : mediaId ? (
        <p className={s.muted}>{loadError || 'Memuat media…'}</p>
      ) : (
        <p className={s.muted}>Belum ada gambar.</p>
      )}
      <div className={s.row}>
        <AdminButton onClick={() => setOpen(true)}>{value ? 'Ganti' : 'Pilih gambar'}</AdminButton>
        {value ? (
          <AdminButton tone="danger" onClick={() => onChange(null)}>
            Hapus
          </AdminButton>
        ) : null}
      </div>
      <p id={`${id}-hint`} className={s.muted}>
        {hint}
      </p>
      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : null}
      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        onChoose={(chosen) => {
          setItem(chosen)
          onChange({ kind: 'media', id: chosen.id })
        }}
      />
    </fieldset>
  )
}
