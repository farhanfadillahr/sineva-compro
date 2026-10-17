'use client'
import { useState } from 'react'
import { routing } from '@/i18n/routing'
import { validateCopyField } from '@/lib/copy/dash-rule'
import type { MediaItem } from '@/features/media/types'
import { Drawer, Dialog } from '../overlays'
import { AdminButton } from '../primitives'
import { MediaDropzone } from './dropzone'
import { ImageField } from './image-field'
import a from '../admin.module.css'
import s from './media.module.css'
export function MediaDetails({
  item,
  onClose,
  onSaved,
  onRemoved,
}: {
  item: MediaItem
  onClose: () => void
  onSaved: (item: MediaItem) => void
  onRemoved: () => void
}) {
  const [value, setValueState] = useState(item),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [saving, setSaving] = useState(false),
    [confirm, setConfirm] = useState(false),
    [usages, setUsages] = useState(item.usages)
  function setValue(next: MediaItem) {
    setValueState(next)
    setNotice('')
  }
  const invalid = [
    value.credit,
    ...Object.values(value.translations).flatMap((t) => [t.alt, t.caption]),
  ]
    .map((text) => validateCopyField(text))
    .find((result) => !result.ok)
  async function save() {
    if (invalid && !invalid.ok) {
      setError(invalid.message)
      return
    }
    setSaving(true)
    setError('')
    try {
      const response = await fetch(`/admin/media/api/${item.id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            translations: value.translations,
            focalX: value.focalX,
            focalY: value.focalY,
            credit: value.credit,
          }),
        }),
        data = await response.json()
      if (!response.ok) {
        setError(data.error ?? 'Metadata belum tersimpan.')
        return
      }
      setValue(data)
      setNotice('Metadata berhasil disimpan.')
      onSaved(data)
    } catch {
      setError('Metadata belum tersimpan. Coba kembali.')
    } finally {
      setSaving(false)
    }
  }
  async function remove() {
    setSaving(true)
    setError('')
    try {
      const response = await fetch(`/admin/media/api/${item.id}`, { method: 'DELETE' }),
        data = await response.json()
      if (!response.ok) {
        setError(data.error ?? 'Media belum dapat dihapus.')
        if (data.usages) setUsages(data.usages)
        setConfirm(false)
        return
      }
      onRemoved()
      onClose()
    } catch {
      setError('Media belum dapat dihapus. Coba kembali.')
    } finally {
      setSaving(false)
    }
  }
  return (
    <Drawer open onClose={onClose} title={item.filename}>
      <div className={s.stack}>
        <p className={s.muted}>
          {item.contentType} · {Math.ceil(item.size / 1024)} KB
          {item.width ? ` · ${item.width} × ${item.height} px` : ''}
        </p>
        <form
          className={s.stack}
          onSubmit={(event) => {
            event.preventDefault()
            void save()
          }}
        >
          {value.isDemo ? (
            <p>
              Contoh metadata belum memiliki file. Unggah file pengganti untuk mengaktifkan
              pratinjau.
            </p>
          ) : value.kind === 'image' ? (
            <ImageField
              allowSelection={false}
              label="Gambar media"
              value={value}
              onChange={(next) => {
                if (next && next.id === value.id) setValue(next)
              }}
            />
          ) : (
            <>
              {value.kind === 'video' ? (
                <video
                  className={s.video}
                  src={value.previewUrl}
                  controls
                  preload="metadata"
                  playsInline
                />
              ) : (
                <a href={value.previewUrl} target="_blank" rel="noreferrer">
                  Unduh PDF untuk diperiksa
                </a>
              )}
              {routing.locales.map((locale) => (
                <label className={a.field} key={locale}>
                  Alt ({locale})
                  <input
                    value={value.translations[locale]?.alt ?? ''}
                    maxLength={200}
                    onChange={(event) =>
                      setValue({
                        ...value,
                        translations: {
                          ...value.translations,
                          [locale]: { ...value.translations[locale], alt: event.target.value },
                        },
                      })
                    }
                  />
                </label>
              ))}
            </>
          )}
          {routing.locales.map((locale) => (
            <label className={a.field} key={locale}>
              Caption ({locale})
              <textarea
                maxLength={1000}
                value={value.translations[locale]?.caption ?? ''}
                onChange={(event) =>
                  setValue({
                    ...value,
                    translations: {
                      ...value.translations,
                      [locale]: { ...value.translations[locale], caption: event.target.value },
                    },
                  })
                }
              />
            </label>
          ))}
          <label className={a.field}>
            Kredit
            <input
              maxLength={160}
              value={value.credit}
              onChange={(event) => setValue({ ...value, credit: event.target.value })}
            />
          </label>
          {invalid && !invalid.ok ? (
            <p role="alert" className={s.error}>
              {invalid.message}
            </p>
          ) : null}
          {notice ? (
            <p role="status" aria-live="polite">
              {notice}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className={s.error}>
              {error}
            </p>
          ) : null}
          <AdminButton type="submit" tone="primary" disabled={saving || !!invalid}>
            {saving ? 'Menyimpan...' : 'Simpan metadata'}
          </AdminButton>
        </form>
        <section className={s.stack} aria-label="Pemakaian media">
          <h3>Dipakai di {usages.length} tempat</h3>
          {usages.length ? (
            <ul>
              {usages.map((usage) => (
                <li key={`${usage.entity}:${usage.entityId}:${usage.field}`}>
                  {usage.label} · {usage.field} ({usage.published ? 'Terbit' : 'Draft'})
                </li>
              ))}
            </ul>
          ) : (
            <p>Belum digunakan pada konten.</p>
          )}
        </section>
        <MediaDropzone
          replace
          endpoint={`/admin/media/api/${item.id}/file`}
          onUploaded={(next) => {
            setValue(next)
            setNotice('File berhasil diganti.')
            onSaved(next)
          }}
        />
        <AdminButton
          tone="danger"
          disabled={saving || usages.length > 0}
          onClick={() => setConfirm(true)}
        >
          Hapus media
        </AdminButton>
        {usages.length ? <p>Lepaskan semua pemakaian sebelum menghapus media.</p> : null}
        <Dialog
          open={confirm}
          onClose={() => setConfirm(false)}
          title="Hapus media dari pustaka"
          confirmName={item.filename}
          confirmLabel="Hapus media"
          onConfirm={() => {
            if (!saving) void remove()
          }}
        >
          <p>
            Media akan dihapus dari pustaka. URL versi yang pernah diterbitkan dapat tetap tersedia
            pada halaman dan cache lama.
          </p>
        </Dialog>
      </div>
    </Drawer>
  )
}
