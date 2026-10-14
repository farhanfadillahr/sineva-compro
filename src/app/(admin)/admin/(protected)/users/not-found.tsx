import Link from 'next/link'
export default function UsersNotFound() {
  return (
    <main>
      <h1 className="dashboard-title">Halaman tidak tersedia</h1>
      <p className="muted">Halaman ini tidak ditemukan atau Anda tidak memiliki akses.</p>
      <Link className="text-link" href="/admin">
        Kembali ke ringkasan
      </Link>
    </main>
  )
}
