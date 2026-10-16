'use client'
import Link from 'next/link'
import { useActionState, useState } from 'react'
import { CmsForm } from '@/components/admin/cms/cms-form'
import { SectionHeader } from '@/components/admin/shell'
import { AdminButton } from '@/components/admin/primitives'
import { InlineBanner } from '@/components/admin/feedback'
import { LocaleTabs } from '@/components/admin/forms'
import { idleState } from '../../cms/errors'
import { EMAIL_TEMPLATE_KEYS, TEMPLATE_PLACEHOLDERS, type EmailTemplateKey } from '../render'
import type { EmailSettingsView } from '../service.server'
import { saveEmailSettingsAction, sendTestEmailAction } from '../actions'
import s from '@/components/admin/admin.module.css'

const templateLabels: Record<EmailTemplateKey, string> = {
  'lead-notification': 'Notifikasi lead (internal)',
  'lead-auto-reply': 'Balasan otomatis untuk lead',
  'waitlist-confirmation': 'Konfirmasi waitlist (belum dikirim di v1)',
}

function TestSend() {
  const [state, submit, pending] = useActionState(sendTestEmailAction, idleState)
  return (
    <form action={submit} className={s.panel}>
      <SectionHeader title="Kirim email uji" helper="Dikirim ke email akun Anda." />
      <AdminButton type="submit" disabled={pending}>
        {pending ? 'Mengirim…' : 'Kirim email uji'}
      </AdminButton>
      {state.status !== 'idle' ? (
        <InlineBanner tone={state.status === 'success' ? 'info' : 'error'}>
          Respons penyedia: {state.message}
        </InlineBanner>
      ) : null}
    </form>
  )
}

export function EmailSettingsForm({
  value,
  inboxEmails,
}: {
  value: EmailSettingsView
  inboxEmails: string[]
}) {
  const locales = Object.keys(value.templates)
  const [locale, setLocale] = useState(locales[0] ?? 'en')
  const managed = value.managedByEnvironment
  return (
    <div className={s.stack}>
      {managed ? (
        <InlineBanner tone="warning">
          Diatur oleh environment ({managed === 'smtp' ? 'SMTP_*' : 'RESEND_API_KEY'}). Nilai di
          environment dipakai untuk pengiriman; isian koneksi di bawah diabaikan.
        </InlineBanner>
      ) : null}
      <InlineBanner tone="info">
        Penerima notifikasi lead: {inboxEmails.length ? inboxEmails.join(', ') : 'belum diatur'} (
        <Link href="/admin/settings">ubah di Pengaturan situs</Link>).
      </InlineBanner>
      <CmsForm
        action={saveEmailSettingsAction}
        initialValue={{
          mode: value.mode,
          smtpHost: value.smtpHost,
          smtpPort: value.smtpPort,
          smtpSecurity: value.smtpSecurity,
          smtpUsername: value.smtpUsername,
          fromName: value.fromName,
          fromEmail: value.fromEmail,
          replyTo: value.replyTo,
          secret: '',
          clearSecret: false,
          templates: value.templates,
        }}
      >
        {(current, setValue, errors) => {
          const field = (
            key: 'smtpHost' | 'smtpUsername' | 'fromName' | 'fromEmail' | 'replyTo',
            label: string,
            type = 'text',
          ) => (
            <label className={s.field} key={key}>
              {label}
              <input
                type={type}
                value={current[key]}
                aria-invalid={!!errors[key]}
                onChange={(event) => setValue({ ...current, [key]: event.target.value })}
              />
              {errors[key] ? <span className={s.error}>{errors[key]}</span> : null}
            </label>
          )
          return (
            <>
              <fieldset className={s.cards} disabled={!!managed}>
                <legend>Mode pengiriman</legend>
                {(
                  [
                    ['resend-api', 'Resend API (disarankan)'],
                    ['smtp', 'SMTP'],
                  ] as const
                ).map(([mode, label]) => (
                  <label key={mode} className={s.radioCard}>
                    <input
                      type="radio"
                      name="mode"
                      checked={current.mode === mode}
                      onChange={() => setValue({ ...current, mode })}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
              {current.mode === 'smtp' ? (
                <div className={s.panel}>
                  <div className={s.row}>
                    {field('smtpHost', 'Host SMTP')}
                    <label className={s.field}>
                      Port
                      <input
                        type="number"
                        min={1}
                        max={65535}
                        value={current.smtpPort}
                        aria-invalid={!!errors.smtpPort}
                        onChange={(event) =>
                          setValue({ ...current, smtpPort: Number(event.target.value) })
                        }
                      />
                      {errors.smtpPort ? <span className={s.error}>{errors.smtpPort}</span> : null}
                    </label>
                    <label className={s.field}>
                      Keamanan
                      <select
                        value={current.smtpSecurity}
                        onChange={(event) =>
                          setValue({
                            ...current,
                            smtpSecurity: event.target.value as 'starttls' | 'tls',
                          })
                        }
                      >
                        <option value="starttls">STARTTLS</option>
                        <option value="tls">TLS</option>
                      </select>
                    </label>
                    {field('smtpUsername', 'Username')}
                  </div>
                </div>
              ) : null}
              <div className={s.panel}>
                <label className={s.field}>
                  {current.mode === 'smtp' ? 'Password SMTP' : 'API key Resend'}
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={current.secret}
                    placeholder={
                      value.hasSecret ? '•••••••• tersimpan (isi untuk mengganti)' : 'Belum ada'
                    }
                    aria-invalid={!!errors.secret}
                    onChange={(event) =>
                      setValue({ ...current, secret: event.target.value, clearSecret: false })
                    }
                  />
                  {errors.secret ? <span className={s.error}>{errors.secret}</span> : null}
                </label>
                <p className={s.muted}>
                  Disimpan terenkripsi dan tidak pernah ditampilkan kembali.
                </p>
                {value.hasSecret ? (
                  <label className={s.switch}>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={current.clearSecret}
                      onChange={(event) =>
                        setValue({ ...current, clearSecret: event.target.checked, secret: '' })
                      }
                    />
                    Hapus rahasia tersimpan
                  </label>
                ) : null}
              </div>
              <div className={s.panel}>
                <div className={s.row}>
                  {field('fromName', 'Nama pengirim')}
                  {field('fromEmail', 'Email pengirim', 'email')}
                  {field('replyTo', 'Balas ke (opsional)', 'email')}
                </div>
              </div>
              <LocaleTabs
                locales={locales.map((code) => ({
                  code,
                  label: code.toUpperCase(),
                  complete: true,
                }))}
                value={locale}
                onChange={setLocale}
                renderPanel={(code) => (
                  <div className={s.stack}>
                    {EMAIL_TEMPLATE_KEYS.map((key) => {
                      const template = current.templates[code][key]
                      const path = `templates.${code}.${key}`
                      const update = (next: Partial<typeof template>) =>
                        setValue({
                          ...current,
                          templates: {
                            ...current.templates,
                            [code]: { ...current.templates[code], [key]: { ...template, ...next } },
                          },
                        })
                      return (
                        <fieldset key={key} className={s.panel}>
                          <legend>{templateLabels[key]}</legend>
                          <p className={s.muted}>
                            Placeholder: {TEMPLATE_PLACEHOLDERS[key].map((p) => `{${p}}`).join(' ')}
                          </p>
                          <label className={s.field}>
                            Subjek
                            <input
                              value={template.subject}
                              aria-invalid={!!errors[`${path}.subject`]}
                              onChange={(event) => update({ subject: event.target.value })}
                            />
                            {errors[`${path}.subject`] ? (
                              <span className={s.error}>{errors[`${path}.subject`]}</span>
                            ) : null}
                          </label>
                          <label className={s.field}>
                            Isi
                            <textarea
                              rows={6}
                              value={template.body}
                              aria-invalid={!!errors[`${path}.body`]}
                              onChange={(event) => update({ body: event.target.value })}
                            />
                            {errors[`${path}.body`] ? (
                              <span className={s.error}>{errors[`${path}.body`]}</span>
                            ) : null}
                          </label>
                        </fieldset>
                      )
                    })}
                  </div>
                )}
              />
            </>
          )
        }}
      </CmsForm>
      <TestSend />
    </div>
  )
}
