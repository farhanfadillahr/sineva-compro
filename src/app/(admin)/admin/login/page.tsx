import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPrincipal } from '@/features/auth/session.server'
import { LoginForm } from '@/features/auth/components/login-form'

export const metadata = { title: 'Masuk' }

export default async function LoginPage() {
  if (await getPrincipal()) redirect('/admin')
  return (
    <main className="login-page">
      <section className="login-intro" aria-label="Sineva Tech">
        <Link href="/" className="brand">
          <Image src="/brand/sineva-symbol-original.svg" alt="" width={44} height={44} priority />
          <span>Sineva Tech</span>
        </Link>
        <div>
          <p className="eyebrow">Ruang kerja Sineva</p>
          <h1>
            Selamat datang
            <br />
            kembali.
          </h1>
          <p className="login-description">
            Masuk dengan akun tim Anda untuk mengelola website Sineva Tech.
          </p>
        </div>
        <Link href="/" className="text-link">
          Kembali ke website <span aria-hidden="true">↗</span>
        </Link>
      </section>
      <section className="login-form-panel" aria-labelledby="login-title">
        <div className="login-form-wrap">
          <p className="eyebrow">Akses tim</p>
          <h2 id="login-title">Masuk ke admin</h2>
          <p className="muted">Gunakan email dan password akun Anda.</p>
          <LoginForm />
          <p className="login-help">Belum memiliki akun? Hubungi administrator Sineva Tech.</p>
        </div>
      </section>
    </main>
  )
}
