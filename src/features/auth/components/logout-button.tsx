'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { LogOut } from 'lucide-react'
import s from '@/components/admin/admin.module.css'

export function LogoutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  async function logout() {
    setBusy(true)
    setError(false)
    try {
      const result = await authClient.signOut()
      if (result.error) {
        setError(true)
        return
      }
      router.replace('/admin/login')
      router.refresh()
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div>
      <button className={s.menuAction} type="button" onClick={logout} disabled={busy}>
        <LogOut size={16} aria-hidden />
        {busy ? 'Sedang keluar…' : 'Keluar'}
      </button>
      {error ? (
        <p className="form-error" role="alert">
          Gagal keluar. Coba lagi.
        </p>
      ) : null}
    </div>
  )
}
