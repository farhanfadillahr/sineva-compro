'use client'
import { useId, useState } from 'react'
import Image from 'next/image'
import { routing } from '@/i18n/routing'
import type { MediaItem } from '@/features/media/types'
import { AdminButton } from '../primitives'
import { MediaPicker } from './picker'
import s from './media.module.css'
import a from '../admin.module.css'
export function ImageField({
  label,
  value,
  onChange,
  locales = routing.locales,
  allowSelection = true,
}: {
  label: string
  value: MediaItem | null
  onChange: (value: MediaItem | null) => void
  locales?: readonly string[]
  allowSelection?: boolean
}) {
  const [open, setOpen] = useState(false),
    id = useId()
  function focal(x: number, y: number) {
    if (value)
      onChange({
        ...value,
        focalX: Math.min(1, Math.max(0, x)),
        focalY: Math.min(1, Math.max(0, y)),
      })
  }
  return (
    <fieldset className={s.stack}>
      <legend>{label}</legend>
      {value ? (
        <>
          <button
            className={s.focal}
            style={{
              width: Math.min(520, ((value.width ?? 200) / (value.height ?? 150)) * 320),
              maxWidth: '100%',
            }}
            type="button"
            aria-label="Pilih titik fokus gambar"
            aria-describedby={`${id}-hint`}
            onClick={(event) => {
              if (event.detail) {
                const rect = event.currentTarget.getBoundingClientRect()
                if (rect.width && rect.height)
                  focal(
                    (event.clientX - rect.left) / rect.width,
                    (event.clientY - rect.top) / rect.height,
                  )
              }
            }}
            onKeyDown={(event) => {
              if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key))
                return
              event.preventDefault()
              focal(
                event.key === 'Home'
                  ? 0.5
                  : value.focalX +
                      (event.key === 'ArrowRight' ? 0.01 : event.key === 'ArrowLeft' ? -0.01 : 0),
                event.key === 'Home'
                  ? 0.5
                  : value.focalY +
                      (event.key === 'ArrowDown' ? 0.01 : event.key === 'ArrowUp' ? -0.01 : 0),
              )
            }}
          >
            <span
              className={s.preview}
              style={{ aspectRatio: `${value.width ?? 200}/${value.height ?? 150}` }}
            >
              <Image
                src={value.previewUrl}
                alt={value.translations.en?.alt ?? ''}
                width={value.width ?? 200}
                height={value.height ?? 150}
                unoptimized
              />
            </span>
            <span
              className={s.crosshair}
              style={{ left: `${value.focalX * 100}%`, top: `${value.focalY * 100}%` }}
            />
          </button>
          <p id={`${id}-hint`} className={s.muted}>
            Klik titik fokus, gunakan tombol panah pada gambar, atau atur penggeser berikut.
          </p>
          <div className={s.controls}>
            <label>
              Fokus horizontal
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(value.focalX * 100)}
                onChange={(event) => focal(Number(event.target.value) / 100, value.focalY)}
              />
            </label>
            <label>
              Fokus vertikal
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(value.focalY * 100)}
                onChange={(event) => focal(value.focalX, Number(event.target.value) / 100)}
              />
            </label>
          </div>
          {locales.map((locale) => (
            <label className={a.field} key={locale}>
              Alt ({locale})
              <input
                maxLength={200}
                value={value.translations[locale]?.alt ?? ''}
                onChange={(event) =>
                  onChange({
                    ...value,
                    translations: {
                      ...value.translations,
                      [locale]: {
                        alt: event.target.value,
                        caption: value.translations[locale]?.caption ?? '',
                      },
                    },
                  })
                }
              />
            </label>
          ))}
          {allowSelection ? (
            <div className={s.toolbar}>
              <AdminButton onClick={() => setOpen(true)}>Ganti gambar</AdminButton>
              <AdminButton onClick={() => onChange(null)} aria-label={`Hapus pilihan ${label}`}>
                Hapus pilihan
              </AdminButton>
            </div>
          ) : null}
        </>
      ) : (
        <AdminButton onClick={() => setOpen(true)}>Pilih gambar untuk {label}</AdminButton>
      )}
      <MediaPicker
        open={allowSelection && open}
        onClose={() => setOpen(false)}
        onChoose={onChange}
      />
    </fieldset>
  )
}
