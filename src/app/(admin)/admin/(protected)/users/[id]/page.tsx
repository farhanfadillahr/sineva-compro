import Link from 'next/link'
import { headers } from 'next/headers'
import { db } from '@/lib/db/client.server'
import { readServerEnv } from '@/env/server'
import { requirePrincipal } from '@/features/auth/session.server'
import { getEditor } from '@/features/users/query.server'
import { readUsersPage } from '@/features/users/page-access.server'
import { UserForm } from '@/features/users/components/user-form'
import { EditorStatusForm } from '@/features/users/components/editor-status-form'
import { EditorPasswordForm } from '@/features/users/components/editor-password-form'
export const metadata = { title: 'Ubah Editor' }
export default async function EditEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePrincipal()
  const { id } = await params
  const requestHeaders = await headers()
  const editor = await readUsersPage(() =>
    getEditor(db, readServerEnv(process.env), requestHeaders, id),
  )
  return (
    <main className="editor-page">
      <Link className="text-link" href="/admin/users">
        ← Pengguna
      </Link>
      <p className="eyebrow">Akses tim · Editor</p>
      <h1 className="dashboard-title">{editor.name}</h1>
      <span className="role-badge">{editor.active ? 'Aktif' : 'Nonaktif'}</span>
      <section className="users-panel">
        <h2>Identitas akun</h2>
        <p className="muted">Mengubah email akan mengakhiri semua session Editor.</p>
        <UserForm editor={editor} />
      </section>
      <section className="users-panel">
        <h2>Status akun</h2>
        <EditorStatusForm editor={editor} />
      </section>
      <section className="users-panel">
        <h2>Ganti password</h2>
        <EditorPasswordForm userId={editor.id} />
      </section>
    </main>
  )
}
