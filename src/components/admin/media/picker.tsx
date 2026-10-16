'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import type { MediaItem, MediaPage } from '@/features/media/types'
import { Dialog } from '../overlays'
import { AdminButton } from '../primitives'
import { MediaDropzone } from './dropzone'
import s from './media.module.css'
import a from '../admin.module.css'
export function MediaPicker({
  open,
  onClose,
  onChoose,
}: {
  open: boolean
  onClose: () => void
  onChoose: (item: MediaItem) => void
}) {
  const [search, setSearch] = useState(''),
    [page, setPage] = useState(1),
    [result, setResult] = useState<MediaPage | null>(null),
    [error, setError] = useState(''),
    [uploading, setUploading] = useState(false)
  useEffect(() => {
    if (!open) return
    const controller = new AbortController(),
      timer = setTimeout(() => {
        setError('')
        setResult(null)
        void fetch(
          `/admin/media/api?${new URLSearchParams({ kind: 'image', search, page: String(page) })}`,
          { signal: controller.signal },
        )
          .then(async (response) => {
            if (!response.ok) throw new Error()
            return response.json() as Promise<MediaPage>
          })
          .then((value) => {
            if (!controller.signal.aborted) setResult(value)
          })
          .catch(() => {
            if (!controller.signal.aborted) setError('Gambar belum dapat dimuat. Coba kembali.')
          })
      }, 200)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [open, search, page])
  function choose(item: MediaItem) {
    onChoose(item)
    onClose()
  }
  return (
    <Dialog open={open} onClose={onClose} title="Pilih gambar">
      <div className={s.stack}>
        <label className={a.field}>
          Cari gambar
          <input
            type="search"
            value={search}
            maxLength={100}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
        </label>
        <AdminButton onClick={() => setUploading((value) => !value)}>
          {uploading ? 'Tutup upload' : 'Unggah gambar'}
        </AdminButton>
        {uploading ? <MediaDropzone imagesOnly onUploaded={choose} /> : null}
        {error ? (
          <p role="alert">{error}</p>
        ) : !result ? (
          <p role="status">Memuat gambar...</p>
        ) : (
          <>
            <div className={s.grid}>
              {result.items
                .filter((item) => !item.isDemo)
                .map((item) => (
                  <button
                    type="button"
                    className={s.card}
                    key={item.id}
                    aria-label={`Pilih ${item.filename}`}
                    onClick={() => choose(item)}
                  >
                    <span className={s.preview}>
                      <Image
                        src={item.previewUrl}
                        alt={item.translations.en?.alt ?? ''}
                        width={item.width ?? 200}
                        height={item.height ?? 150}
                        unoptimized
                      />
                    </span>
                    <span className={s.info}>{item.filename}</span>
                  </button>
                ))}
            </div>
            {!result.items.length ? <p>Belum ada gambar yang cocok.</p> : null}
            <div className={s.pagination}>
              <AdminButton
                disabled={result.page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                Sebelumnya
              </AdminButton>
              <span>Halaman {result.page}</span>
              <AdminButton
                disabled={result.page * result.pageSize >= result.total}
                onClick={() => setPage((value) => value + 1)}
              >
                Berikutnya
              </AdminButton>
            </div>
          </>
        )}
      </div>
    </Dialog>
  )
}
