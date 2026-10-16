import { requirePrincipal } from '@/features/auth/session.server'

export const metadata = { title: 'Ringkasan' }

export default async function DashboardPage() {
  const principal = await requirePrincipal()
  return (
    <main>
      <p className="eyebrow">Ringkasan</p>
      <h1 className="dashboard-title">Halo, {principal.name}.</h1>
      <p className="muted">Selamat datang di ruang kerja Sineva.</p>
      <section className="account-card" aria-labelledby="account-title">
        <div>
          <h2 id="account-title">Akun Anda</h2>
          <p className="muted">Identitas dan akses akun yang sedang digunakan.</p>
        </div>
        <dl>
          <div>
            <dt>Nama</dt>
            <dd>{principal.name}</dd>
          </div>
          <div>
            <dt>Peran</dt>
            <dd>
              <span className="role-badge">
                {principal.role === 'admin' ? 'Administrator' : 'Editor'}
              </span>
            </dd>
          </div>
        </dl>
      </section>
    </main>
  )
}
