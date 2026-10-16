'use client'
import { useEffect, useId, useRef, useState, type ClipboardEvent } from 'react'
import { routing } from '@/i18n/routing'
import { validateCopyField, FORBIDDEN_DASH_MESSAGE } from '@/lib/copy/dash-rule'
import type { MediaItem } from '@/features/media/types'
import { AdminButton } from '../primitives'
import { Progress } from '../feedback'
import s from './media.module.css'
import a from '../admin.module.css'
type Entry = {
  id: string
  file: File
  translations: Record<string, { alt: string; caption: string }>
  state: 'ready' | 'uploading' | 'done' | 'error'
  progress: number
  error: string
}
const allowed = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'video/mp4',
  'video/webm',
  'application/pdf',
]
export function MediaDropzone({
  onUploaded,
  endpoint = '/admin/media/api',
  replace = false,
  imagesOnly = false,
  locales = routing.locales,
}: {
  onUploaded: (item: MediaItem) => void
  endpoint?: string
  replace?: boolean
  imagesOnly?: boolean
  locales?: readonly string[]
}) {
  const input = useRef<HTMLInputElement>(null),
    requests = useRef(new Map<string, XMLHttpRequest>()),
    id = useId()
  const [entries, setEntries] = useState<Entry[]>([]),
    [drag, setDrag] = useState(false)
  useEffect(() => {
    const active = requests.current
    return () => {
      for (const xhr of active.values()) xhr.abort()
    }
  }, [])
  function patch(key: string, value: Partial<Entry>) {
    setEntries((rows) => rows.map((row) => (row.id === key ? { ...row, ...value } : row)))
  }
  function enqueue(files: File[]) {
    setEntries((rows) => [
      ...rows,
      ...(replace ? files.slice(0, 1) : files).map((file) => {
        const accepted =
          (!file.type || allowed.includes(file.type)) &&
          (!imagesOnly || !file.type || file.type.startsWith('image/'))
        const max = file.type.startsWith('video/') ? 20 * 1024 * 1024 : 10 * 1024 * 1024
        const error = !accepted
          ? 'Jenis file tidak didukung.'
          : !file.size || file.size > max
            ? 'Ukuran file melewati batas.'
            : ''
        return {
          id: crypto.randomUUID(),
          file,
          translations: Object.fromEntries(
            locales.map((locale) => [locale, { alt: '', caption: '' }]),
          ),
          state: error ? ('error' as const) : ('ready' as const),
          progress: 0,
          error,
        }
      }),
    ])
  }
  function paste(event: ClipboardEvent) {
    const files = Array.from(event.clipboardData.files)
    if (files.length) {
      event.preventDefault()
      enqueue(files)
    }
  }
  function upload(entry: Entry) {
    const valid =
      replace ||
      locales.every(
        (locale) =>
          entry.translations[locale]?.alt.trim() &&
          validateCopyField(entry.translations[locale].alt).ok,
      )
    if (!valid) return
    const xhr = new XMLHttpRequest()
    requests.current.set(entry.id, xhr)
    patch(entry.id, { state: 'uploading', progress: 0, error: '' })
    xhr.open(replace ? 'PUT' : 'POST', endpoint)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable)
        patch(entry.id, { progress: Math.round((event.loaded / event.total) * 100) })
    }
    xhr.onerror = () => {
      requests.current.delete(entry.id)
      patch(entry.id, { state: 'error', error: 'Upload gagal. Coba kembali.' })
    }
    xhr.onabort = () => {
      requests.current.delete(entry.id)
      patch(entry.id, { state: 'ready', progress: 0, error: 'Upload dibatalkan.' })
    }
    xhr.onload = () => {
      requests.current.delete(entry.id)
      let data: MediaItem & { error?: string }
      try {
        data = JSON.parse(xhr.responseText)
      } catch {
        patch(entry.id, { state: 'error', error: 'Respons upload tidak valid.' })
        return
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        patch(entry.id, { state: 'done', progress: 100 })
        onUploaded(data)
      } else patch(entry.id, { state: 'error', error: data.error ?? 'Upload gagal. Coba kembali.' })
    }
    const form = new FormData()
    form.set('file', entry.file)
    if (!replace)
      form.set(
        'metadata',
        JSON.stringify({ translations: entry.translations, focalX: 0.5, focalY: 0.5, credit: '' }),
      )
    xhr.send(form)
  }
  return (
    <section
      className={s.stack}
      aria-label={replace ? 'Ganti file media' : 'Unggah media'}
      onPaste={paste}
    >
      <div
        className={s.drop}
        data-drag={drag}
        onDragOver={(event) => {
          event.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDrag(false)
          enqueue(Array.from(event.dataTransfer.files))
        }}
      >
        <span>
          {replace
            ? 'Pilih file pengganti dengan jenis yang sama'
            : 'Seret file ke sini atau tempel dari clipboard'}
        </span>
        <AdminButton onClick={() => input.current?.click()}>Pilih file</AdminButton>
        <label hidden htmlFor={id}>
          Pilih file media
        </label>
        <input
          ref={input}
          hidden
          id={id}
          className={s.file}
          type="file"
          accept={(imagesOnly ? allowed.filter((type) => type.startsWith('image/')) : allowed).join(
            ',',
          )}
          multiple={!replace}
          onChange={(event) => {
            enqueue(Array.from(event.target.files ?? []))
            event.target.value = ''
          }}
        />
        <span className={s.muted}>
          JPEG, PNG, WebP, AVIF: 10 MB/6000 px. Video MP4/WebM: 20 MB. PDF: 10 MB. SVG tidak
          didukung.
        </span>
      </div>
      {entries.map((entry) => (
        <div key={entry.id} className={s.queue}>
          <strong>{entry.file.name}</strong>
          {!replace
            ? locales.map((locale) => (
                <label className={a.field} key={locale}>
                  Alt ({locale}) untuk {entry.file.name}
                  <input
                    maxLength={200}
                    required
                    value={entry.translations[locale].alt}
                    disabled={entry.state === 'uploading' || entry.state === 'done'}
                    onChange={(event) =>
                      patch(entry.id, {
                        translations: {
                          ...entry.translations,
                          [locale]: { ...entry.translations[locale], alt: event.target.value },
                        },
                      })
                    }
                  />
                </label>
              ))
            : null}
          {locales.some((locale) => !validateCopyField(entry.translations[locale].alt).ok) ? (
            <p role="alert" className={s.error}>
              {FORBIDDEN_DASH_MESSAGE}
            </p>
          ) : null}
          {entry.error ? (
            <p role="alert" className={s.error}>
              {entry.error}
            </p>
          ) : null}
          {entry.state === 'uploading' ? (
            <>
              <Progress label={`Upload ${entry.file.name}`} value={entry.progress} />
              <AdminButton onClick={() => requests.current.get(entry.id)?.abort()}>
                Batalkan {entry.file.name}
              </AdminButton>
            </>
          ) : entry.state === 'done' ? (
            <p role="status">{entry.file.name} berhasil diunggah.</p>
          ) : (
            <AdminButton
              tone="primary"
              disabled={
                !replace &&
                !locales.every(
                  (locale) =>
                    entry.translations[locale].alt.trim() &&
                    validateCopyField(entry.translations[locale].alt).ok,
                )
              }
              onClick={() => upload(entry)}
            >
              {entry.state === 'error' ? 'Coba lagi' : 'Unggah'} {entry.file.name}
            </AdminButton>
          )}
        </div>
      ))}
    </section>
  )
}
