'use client'
import Link from 'next/link'
import { CmsForm } from '@/components/admin/cms/cms-form'
import { InlineBanner } from '@/components/admin/feedback'
import { SectionHeader } from '@/components/admin/shell'
import type { ProductLaunchStatus } from '../../content/types'
import { saveProductStatusAction } from '../actions'
import s from '@/components/admin/admin.module.css'

const options: { value: ProductLaunchStatus; label: string; hint: string }[] = [
  {
    value: 'coming_soon',
    label: 'Segera hadir',
    hint: 'Tombol situs mengajak bergabung ke waitlist.',
  },
  { value: 'live', label: 'Tersedia', hint: 'Tombol situs mengajak mencoba produk.' },
]

export function ProductStatusForm({ status }: { status: ProductLaunchStatus }) {
  return (
    <section className={s.stack} aria-label="Status produk">
      <SectionHeader
        title="Status produk"
        helper="Disimpan sekali dan dibaca Beranda serta halaman Produk."
      />
      <CmsForm
        action={saveProductStatusAction}
        initialValue={{ status }}
        submitLabel="Simpan status"
      >
        {(value, setValue) => (
          <fieldset className={s.cards}>
            <legend className={s.srOnly}>Status produk</legend>
            {options.map((option) => (
              <label key={option.value} className={s.radioCard}>
                <input
                  type="radio"
                  name="productStatus"
                  value={option.value}
                  checked={value.status === option.value}
                  onChange={() => setValue({ status: option.value })}
                />
                <span>
                  <strong>{option.label}</strong>
                  <br />
                  <span className={s.muted}>{option.hint}</span>
                </span>
              </label>
            ))}
            {value.status === 'live' ? (
              // The status switches the buttons and hides the waitlist, but labels typed in the
              // page content stay as written (CPR-106).
              <InlineBanner tone="warning">
                Periksa juga label yang masih mengajak bergabung ke waitlist, misalnya tombol kedua
                di hero Beranda. Ubah di <Link href="/admin/pages/home">Halaman &gt; Beranda</Link>{' '}
                dan <Link href="/admin/pages/product">Halaman &gt; Produk</Link>.
              </InlineBanner>
            ) : null}
          </fieldset>
        )}
      </CmsForm>
    </section>
  )
}
