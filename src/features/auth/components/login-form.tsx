'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'

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
    <form onSubmit={handleSubmit} className="auth-form" aria-busy={busy}>
      <div className="form-field">
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
      <div className="form-field">
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
        <p id="login-error" className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="button-primary" type="submit" disabled={busy}>
        {busy ? 'Sedang masuk…' : 'Masuk'}
      </button>
    </form>
  )
}
