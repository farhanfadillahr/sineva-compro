import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPrincipal } from '@/features/auth/session.server'
import { LoginForm } from '@/features/auth/components/login-form'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import s from '@/components/admin/auth.module.css'
import a from '@/components/admin/admin.module.css'

export const metadata = { title: 'Masuk' }

export default async function LoginPage() {
  if (await getPrincipal()) redirect('/admin')
  return (
    <main className={s.page}>
      <section className={s.intro} aria-label="Sineva">
        <Link href="/" className={s.brand}>
          <Image src="/brand/sineva-symbol-original.svg" alt="" width={32} height={32} priority />
          <span>Sineva</span>
        </Link>
        <div>
          <p className={s.eyebrow}>Ruang kerja Sineva</p>
          <h1>
            Selamat datang <span>kembali.</span>
          </h1>
          <p className={s.description}>
            Masuk dengan akun tim Anda untuk mengelola website Sineva.
          </p>
        </div>
        <Link href="/" className={s.back}>
          Kembali ke website <span aria-hidden="true">↗</span>
        </Link>
      </section>
      <section className={s.panel} aria-labelledby="login-title">
        <div className={s.toolbar}>
          <ThemeToggle
            labels={{ toDark: 'Ganti ke mode gelap', toLight: 'Ganti ke mode terang' }}
            className={a.button}
          />
        </div>
        <div className={s.formWrap}>
          <p className={s.eyebrow}>Akses tim</p>
          <h2 id="login-title">Masuk ke admin</h2>
          <p>Gunakan email dan password akun Anda.</p>
          <LoginForm />
          <p className={s.help}>Belum memiliki akun? Hubungi administrator Sineva.</p>
        </div>
      </section>
    </main>
  )
}
