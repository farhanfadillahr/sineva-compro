'use client'
import { AdminButton } from '@/components/admin/primitives'
export default function MediaErrorPage({ reset }: { reset: () => void }) {
  return (
    <section role="alert">
      <h1>Media belum dapat dimuat</h1>
      <p>Periksa kesiapan penyimpanan dan database, lalu coba kembali.</p>
      <AdminButton onClick={reset}>Coba kembali</AdminButton>
    </section>
  )
}
