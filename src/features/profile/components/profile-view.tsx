'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CmsForm } from '@/components/admin/cms/cms-form'
import { ConfirmAction } from '@/components/admin/cms/confirm-action'
import { SectionHeader } from '@/components/admin/shell'
import { AdminButton } from '@/components/admin/primitives'
import { InlineBanner } from '@/components/admin/feedback'
import {
  changePasswordAction,
  revokeSessionsAction,
  savePreferencesAction,
  updateNameAction,
} from '../actions'
import s from '@/components/admin/admin.module.css'

type Profile = {
  profile: { name: string; email: string; hasAvatar: boolean }
  sessions: {
    id: string
    device: string
    ipAddress: string | null
    lastActive: string
    current: boolean
  }[]
  preferences: { density: 'comfortable' | 'compact'; sidebarCollapsed: boolean }
  reauthRequired: boolean
}

function PasswordInput({
  label,
  value,
  error,
  autoComplete,
  onChange,
}: {
  label: string
  value: string
  error?: string
  autoComplete: string
  onChange: (value: string) => void
}) {
  return (
    <label className={s.field}>
      {label}
      <input
        type="password"
        value={value}
        autoComplete={autoComplete}
        maxLength={128}
        aria-invalid={!!error}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <span className={s.error} role="alert">
          {error}
        </span>
      ) : null}
    </label>
  )
}

function Avatar({ hasAvatar }: { hasAvatar: boolean }) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<{ busy: boolean; error: string }>({ busy: false, error: '' })
  const [version, setVersion] = useState(0)
  async function upload(file: File) {
    setState({ busy: true, error: '' })
    const body = new FormData()
    body.set('file', file)
    const response = await fetch('/admin/profil/avatar', { method: 'POST', body })
    if (response.ok) {
      setState({ busy: false, error: '' })
      setVersion((v) => v + 1)
      router.refresh()
    } else {
      const data = (await response.json().catch(() => ({}))) as { error?: string }
      setState({ busy: false, error: data.error ?? 'Avatar belum dapat diunggah.' })
    }
  }
  return (
    <div className={s.row}>
      {hasAvatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/admin/profil/avatar?v=${version}`}
          alt="Avatar Anda"
          width={64}
          height={64}
          style={{ borderRadius: '50%' }}
        />
      ) : null}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void upload(file)
          event.target.value = ''
        }}
      />
      <AdminButton disabled={state.busy} onClick={() => input.current?.click()}>
        {state.busy ? 'Mengunggah…' : hasAvatar ? 'Ganti avatar' : 'Unggah avatar'}
      </AdminButton>
      <span className={s.muted}>JPEG, PNG, WebP atau AVIF. Dipotong persegi 256 px.</span>
      {state.error ? (
        <p className={s.error} role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  )
}

export function ProfileView({ data }: { data: Profile }) {
  return (
    <div className={s.stack}>
      <section className={s.panel} aria-labelledby="profil">
        <SectionHeader
          title="Profil"
          helper="Email hanya dapat diubah Admin melalui halaman Pengguna."
        />
        <h2 id="profil" className={s.srOnly}>
          Profil
        </h2>
        <Avatar hasAvatar={data.profile.hasAvatar} />
        <CmsForm
          action={updateNameAction}
          initialValue={{ name: data.profile.name }}
          submitLabel="Simpan nama"
        >
          {(value, setValue, errors) => (
            <>
              <label className={s.field}>
                Nama
                <input
                  value={value.name}
                  autoComplete="name"
                  maxLength={80}
                  aria-invalid={!!errors.name}
                  onChange={(event) => setValue({ name: event.target.value })}
                />
                {errors.name ? <span className={s.error}>{errors.name}</span> : null}
              </label>
              <label className={s.field}>
                Email
                <input value={data.profile.email} readOnly aria-readonly />
              </label>
            </>
          )}
        </CmsForm>
      </section>

      <section className={s.panel} id="keamanan" aria-label="Keamanan">
        <SectionHeader
          title="Keamanan"
          helper="Mengganti password mengeluarkan semua sesi lain. Password salah dihitung untuk penguncian akun."
        />
        <CmsForm
          action={changePasswordAction}
          initialValue={{ currentPassword: '', newPassword: '', confirmPassword: '' }}
          submitLabel="Ganti password"
        >
          {(value, setValue, errors) => (
            <>
              <PasswordInput
                label="Password saat ini"
                value={value.currentPassword}
                error={errors.currentPassword}
                autoComplete="current-password"
                onChange={(v) => setValue({ ...value, currentPassword: v })}
              />
              <PasswordInput
                label="Password baru (12 sampai 128 karakter)"
                value={value.newPassword}
                error={errors.newPassword}
                autoComplete="new-password"
                onChange={(v) => setValue({ ...value, newPassword: v })}
              />
              <p className={s.muted} aria-live="polite">
                Kekuatan:{' '}
                {value.newPassword.length >= 16
                  ? 'baik'
                  : value.newPassword.length >= 12
                    ? 'cukup'
                    : 'terlalu pendek'}
              </p>
              <PasswordInput
                label="Konfirmasi password baru"
                value={value.confirmPassword}
                error={errors.confirmPassword}
                autoComplete="new-password"
                onChange={(v) => setValue({ ...value, confirmPassword: v })}
              />
            </>
          )}
        </CmsForm>
      </section>

      <section className={s.panel} aria-label="Sesi aktif">
        <SectionHeader title="Sesi aktif" helper="Perangkat yang sedang masuk dengan akun Anda." />
        {data.reauthRequired ? (
          <InlineBanner tone="info">
            Sesi ini dibuka lebih dari 15 menit lalu. Masukkan password untuk mengeluarkan sesi
            lain.
          </InlineBanner>
        ) : null}
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Perangkat</th>
                <th scope="col">IP</th>
                <th scope="col">Terakhir aktif</th>
                <th scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.sessions.map((session) => (
                <tr key={session.id}>
                  <td>
                    {session.device} {session.current ? <strong>(sesi ini)</strong> : null}
                  </td>
                  <td className={s.mono}>{session.ipAddress ?? '-'}</td>
                  <td className={s.mono}>{new Date(session.lastActive).toLocaleString('id-ID')}</td>
                  <td>
                    {session.current ? null : (
                      <RevokeForm
                        sessionId={session.id}
                        label="Keluar dari sesi ini"
                        needsPassword={data.reauthRequired}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.sessions.some((session) => !session.current) ? (
          <RevokeForm
            sessionId="others"
            label="Keluar dari semua perangkat lain"
            needsPassword={data.reauthRequired}
          />
        ) : null}
      </section>

      <section className={s.panel} aria-label="Preferensi">
        <SectionHeader title="Preferensi" helper="Disimpan untuk akun Anda di semua perangkat." />
        <CmsForm
          action={savePreferencesAction}
          initialValue={data.preferences}
          submitLabel="Simpan preferensi"
        >
          {(value, setValue) => (
            <>
              <fieldset className={s.cards}>
                <legend>Kepadatan tabel</legend>
                {(
                  [
                    ['comfortable', 'Lega'],
                    ['compact', 'Rapat'],
                  ] as const
                ).map(([density, label]) => (
                  <label key={density} className={s.radioCard}>
                    <input
                      type="radio"
                      name="density"
                      checked={value.density === density}
                      onChange={() => setValue({ ...value, density })}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
              <label className={s.switch}>
                <input
                  type="checkbox"
                  role="switch"
                  checked={value.sidebarCollapsed}
                  onChange={(event) =>
                    setValue({ ...value, sidebarCollapsed: event.target.checked })
                  }
                />
                Ciutkan sidebar secara bawaan
              </label>
            </>
          )}
        </CmsForm>
      </section>
    </div>
  )
}

function RevokeForm({
  sessionId,
  label,
  needsPassword,
}: {
  sessionId: string
  label: string
  needsPassword: boolean
}) {
  if (!needsPassword)
    return (
      <ConfirmAction
        action={revokeSessionsAction}
        fields={{ payload: JSON.stringify({ sessionId }) }}
        label={label}
        tone="secondary"
        title={label}
        description="Perangkat tersebut harus masuk kembali."
        confirmLabel="Keluarkan"
      />
    )
  return (
    <CmsForm
      action={revokeSessionsAction}
      initialValue={{ sessionId, password: '' }}
      submitLabel={label}
    >
      {(value, setValue, errors) => (
        <PasswordInput
          label="Password"
          value={value.password}
          error={errors.password}
          autoComplete="current-password"
          onChange={(v) => setValue({ ...value, password: v })}
        />
      )}
    </CmsForm>
  )
}
