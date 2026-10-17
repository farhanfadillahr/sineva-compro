'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { MediaItem, MediaPage } from '@/features/media/types'
import { PageHeader } from '../shell'
import { AdminButton } from '../primitives'
import { Toast } from '../feedback'
import { MediaDropzone } from './dropzone'
import { MediaDetails } from './details'
import { MediaPicker } from './picker'
import a from '../admin.module.css'
import s from './media.module.css'
export function MediaLibrary({
  result,
  search,
  kind,
}: {
  result: MediaPage
  search: string
  kind: string
}) {
  const router = useRouter(),
    [upload, setUpload] = useState(false),
    [selected, setSelected] = useState<MediaItem | null>(null),
    [notice, setNotice] = useState(''),
    [showPicker, setShowPicker] = useState(false)
  function url(page: number, nextSearch = search, nextKind = kind) {
    return `/admin/media?${new URLSearchParams({ search: nextSearch, kind: nextKind, page: String(page) })}`
  }
  return (
    <main className={s.stack}>
      <PageHeader
        title="Media"
        description="Kelola gambar, video, dokumen dan pemakaiannya pada konten."
        actions={
          <AdminButton tone="primary" onClick={() => setUpload((value) => !value)}>
            {upload ? 'Tutup upload' : 'Unggah media'}
          </AdminButton>
        }
      />
      {upload ? (
        <div className={a.panel}>
          <MediaDropzone
            onUploaded={() => {
              setNotice('Media berhasil diunggah.')
              router.refresh()
            }}
          />
        </div>
      ) : null}
      <section className={`${a.panel} ${s.stack}`} aria-label="Pustaka media">
        <form
          className={s.toolbar}
          onSubmit={(event) => {
            event.preventDefault()
            const form = new FormData(event.currentTarget)
            router.push(url(1, String(form.get('search') ?? ''), String(form.get('kind') ?? '')))
          }}
        >
          <label className={a.field}>
            Cari media
            <input type="search" name="search" defaultValue={search} maxLength={100} />
          </label>
          <label className={a.field}>
            Jenis media
            <select name="kind" defaultValue={kind}>
              <option value="">Semua jenis</option>
              <option value="image">Gambar</option>
              <option value="video">Video</option>
              <option value="document">PDF</option>
            </select>
          </label>
          <AdminButton type="submit">Terapkan filter</AdminButton>
          <AdminButton onClick={() => setShowPicker((value) => !value)}>Pilih gambar</AdminButton>
        </form>
        <MediaPicker
          open={showPicker}
          onClose={() => setShowPicker(false)}
          onChoose={setSelected}
        />
        {result.items.length ? (
          <div className={s.grid}>
            {result.items.map((item) => (
              <button
                type="button"
                className={s.card}
                key={item.id}
                aria-label={`Detail ${item.filename}`}
                onClick={() => setSelected(item)}
              >
                <span className={s.preview}>
                  {item.isDemo ? (
                    <span>Contoh metadata</span>
                  ) : item.kind === 'image' ? (
                    <Image
                      src={item.previewUrl}
                      alt={item.translations.en?.alt ?? ''}
                      width={item.width ?? 200}
                      height={item.height ?? 150}
                      unoptimized
                    />
                  ) : (
                    <span>{item.kind === 'video' ? 'Video' : 'PDF'}</span>
                  )}
                </span>
                <span className={s.info}>
                  <strong>{item.filename}</strong>
                  <span className={s.muted}>
                    {Math.ceil(item.size / 1024)} KB · {item.usageCount} pemakaian
                  </span>
                  <span className={s.muted}>
                    {item.publicUrl ? 'Pernah diterbitkan' : 'Privat'}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p>Belum ada media yang cocok. Unggah file atau ubah filter pencarian.</p>
        )}
        <div className={s.pagination}>
          <span>
            {result.total} media · Halaman {result.page}
          </span>
          <div className={s.toolbar}>
            <AdminButton
              disabled={result.page <= 1}
              onClick={() => router.push(url(result.page - 1))}
            >
              Sebelumnya
            </AdminButton>
            <AdminButton
              disabled={result.page * result.pageSize >= result.total}
              onClick={() => router.push(url(result.page + 1))}
            >
              Berikutnya
            </AdminButton>
          </div>
        </div>
      </section>
      {selected ? (
        <MediaDetails
          key={selected.id}
          item={selected}
          onClose={() => setSelected(null)}
          onSaved={(next) => {
            setSelected(next)
            setNotice('Media berhasil disimpan.')
            router.refresh()
          }}
          onRemoved={() => {
            setNotice('Media dihapus dari pustaka.')
            router.refresh()
          }}
        />
      ) : null}
      {notice ? <Toast message={notice} onDismiss={() => setNotice('')} /> : null}
    </main>
  )
}
