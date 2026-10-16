'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { AdminButton } from '@/components/admin/primitives'
import s from '@/components/admin/admin.module.css'
import a from '@/components/admin/auth.module.css'

export function LoginForm() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const data = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    try {
      const result = await authClient.signIn.email({
        email: String(data.get('email')).trim(),
        password: String(data.get('password')),
      })
      if (result.error) {
        setError('Tidak dapat masuk. Periksa email dan password, lalu coba lagi.')
        return
      }
      router.replace('/admin')
      router.refresh()
    } catch {
      setError('Tidak dapat terhubung. Periksa koneksi Anda, lalu coba lagi.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={handleSubmit} className={a.form} aria-busy={busy}>
      <div className={s.field}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          aria-describedby={error ? 'login-error' : undefined}
        />
      </div>
      <div className={s.field}>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          aria-describedby={error ? 'login-error' : undefined}
        />
      </div>
      {error ? (
        <p id="login-error" className={s.error} role="alert">
          {error}
        </p>
      ) : null}
      <AdminButton tone="primary" type="submit" disabled={busy}>
        {busy ? 'Sedang masuk…' : 'Masuk'}
      </AdminButton>
    </form>
  )
}
