import Link from 'next/link'
import { requireCapability } from '@/features/auth/session.server'
import { readUsersPage } from '@/features/users/page-access.server'
import { UserForm } from '@/features/users/components/user-form'
export const metadata = { title: 'Tambah Editor' }
export default async function NewEditorPage() {
  await readUsersPage(() => requireCapability('users:manage'))
  return (
    <main className="editor-page">
      <Link className="text-link" href="/admin/users">
        ← Pengguna
      </Link>
      <p className="eyebrow">Akses tim</p>
      <h1 className="dashboard-title">Tambah Editor</h1>
      <p className="muted">
        Editor dapat mengelola konten. Pengaturan pengguna dan data lead hanya tersedia untuk Admin.
      </p>
      <section className="users-panel">
        <h2>Identitas akun</h2>
        <UserForm />
      </section>
    </main>
  )
}
