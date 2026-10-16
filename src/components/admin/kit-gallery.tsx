'use client'
import { useState } from 'react'
import Link from 'next/link'
import { PageHeader, SectionHeader, FormLayout } from './shell'
import { ContentField, SlugInput, Toggle, MultiSelect } from './forms'
import { DatePicker } from './date-picker'
import { SortableList } from './sortable-list'
import { RichTextEditor } from './rich-text-editor'
import { Dialog, Popover } from './overlays'
import { Toast, InlineBanner } from './feedback'
import s from './admin.module.css'

/** Development-only examples. The route is authenticated and 404s in production. */
export function KitGallery() {
  const [date, setDate] = useState<string>()
  const [selected, setSelected] = useState<string[]>([])
  const [items, setItems] = useState([
    { id: 'discovery', label: 'AI Discovery' },
    { id: 'build', label: 'AI Build' },
    { id: 'enablement', label: 'AI Enablement' },
  ])
  const [confirm, setConfirm] = useState(false)
  const [toast, setToast] = useState('')
  return (
    <main>
      <PageHeader
        title="Galeri antarmuka admin"
        description="Contoh komponen untuk pengujian lokal. Perubahan pada galeri ini tidak disimpan."
      />
      <FormLayout
        side={
          <>
            <section className={s.panel}>
              <SectionHeader title="Status" />
              <Toggle label="Tampilkan contoh" name="visible" defaultChecked />
              <DatePicker label="Tanggal terbit" value={date} onChange={setDate} />
              <button
                type="button"
                className={`${s.button} ${s.primary}`}
                onClick={() => setToast('Contoh berhasil disimpan')}
              >
                Uji notifikasi berhasil
              </button>
            </section>
            <Popover label="Panduan editor" title="Menulis konten">
              <p>Gunakan judul dan kalimat yang mudah dipahami.</p>
              <Link href="/admin/users">Buka pengguna</Link>
            </Popover>
            <button
              type="button"
              className={`${s.button} ${s.danger}`}
              onClick={() => setConfirm(true)}
            >
              Hapus contoh
            </button>
          </>
        }
      >
        <InlineBanner>
          Galeri memakai data contoh dan hanya tersedia dalam development lokal.
        </InlineBanner>
        <form
          className={`${s.panel} ${s.stack}`}
          onSubmit={(event) => {
            event.preventDefault()
            setToast('Validasi contoh berhasil')
          }}
        >
          <SectionHeader title="Konten" />
          <ContentField
            label="Judul konten"
            name="title"
            limit={80}
            required
            defaultValue="AI untuk kebutuhan usaha"
          />
          <SlugInput title="AI untuk kebutuhan usaha" name="slug" prefix="/blog/" />
          <MultiSelect
            label="Kategori"
            value={selected}
            onChange={setSelected}
            options={[
              { value: 'ai', label: 'AI' },
              { value: 'ops', label: 'Operasi' },
            ]}
          />
          <button className={s.button} type="submit">
            Periksa form
          </button>
        </form>
        <section className={s.panel}>
          <SectionHeader title="Urutan layanan" />
          <SortableList
            label="Layanan contoh"
            items={items}
            onChange={setItems}
            renderItem={(item) => item.label}
          />
        </section>
        <RichTextEditor label="Isi artikel" name="body" onChange={() => {}} />
      </FormLayout>
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Hapus contoh"
        confirmName="Contoh artikel"
        onConfirm={() => {
          setConfirm(false)
          setToast('Contoh dihapus')
        }}
      >
        <p>Ini hanya simulasi konfirmasi.</p>
      </Dialog>
      {toast ? <Toast message={toast} onDismiss={() => setToast('')} /> : null}
    </main>
  )
}
