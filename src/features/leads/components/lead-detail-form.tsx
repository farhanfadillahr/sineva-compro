'use client'
import { CmsForm } from '@/components/admin/cms/cms-form'
import { DescriptionList } from '@/components/admin/display'
import { LEAD_STATUSES, type LeadEmailResult, type LeadEmailStatus } from '../schema'
import { deleteLeadAction, updateLeadAction } from '../admin-actions'
import { ConfirmAction } from '@/components/admin/cms/confirm-action'
import s from '@/components/admin/admin.module.css'

const labels: Record<string, string> = {
  new: 'Baru',
  contacted: 'Dihubungi',
  qualified: 'Berpotensi',
  won: 'Berhasil',
  lost: 'Tidak lanjut',
}

type Lead = {
  id: string
  name: string
  email: string
  phone: string
  company: string | null
  segment: string
  interest: string
  budget: string | null
  message: string
  locale: string
  sourcePage: string
  status: string
  notes: string
  consentAt: string
  createdAt: string
  emailStatus: LeadEmailStatus | null
}

const emailLabels: Record<LeadEmailResult['status'], string> = {
  sent: 'Terkirim',
  failed: 'Gagal',
  mock: 'Mode uji, tidak benar-benar dikirim',
  skipped: 'Tidak dikirim',
}

/** One line per email: outcome, time and the provider's answer (CPR-112). */
function emailLine(result: LeadEmailResult | undefined) {
  if (!result) return 'Belum ada data (lead masuk sebelum pencatatan ini).'
  const when = new Date(result.at).toLocaleString('id-ID')
  return (
    <span data-email-status={result.status}>
      <strong className={result.status === 'failed' ? s.error : undefined}>
        {emailLabels[result.status]}
      </strong>
      , {when}
      <br />
      <span className={s.muted}>{result.detail}</span>
    </span>
  )
}

export function LeadDetail({ lead }: { lead: Lead }) {
  const whatsapp = `https://wa.me/${lead.phone}?text=${encodeURIComponent(`Hi ${lead.name}, this is Sineva following up on your message.`)}`
  return (
    <div className={s.formLayout}>
      <div className={s.stack}>
        <section className={s.panel} aria-label="Data lead">
          <DescriptionList
            items={[
              { label: 'Nama', value: lead.name },
              {
                label: 'Email',
                value: <a href={`mailto:${lead.email}`}>{lead.email}</a>,
                copyValue: lead.email,
              },
              { label: 'WhatsApp', value: `+${lead.phone}`, copyValue: `+${lead.phone}` },
              { label: 'Perusahaan', value: lead.company ?? '-' },
              { label: 'Jenis bisnis', value: lead.segment },
              { label: 'Kebutuhan', value: lead.interest },
              { label: 'Anggaran', value: lead.budget ?? '-' },
              { label: 'Sumber', value: lead.sourcePage },
              { label: 'Bahasa', value: lead.locale.toUpperCase() },
              { label: 'Persetujuan', value: new Date(lead.consentAt).toLocaleString('id-ID') },
              { label: 'Masuk', value: new Date(lead.createdAt).toLocaleString('id-ID') },
            ]}
          />
        </section>
        <section className={s.panel} aria-label="Pesan">
          <h2>Pesan</h2>
          <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{lead.message}</p>
        </section>
        <section className={s.panel} aria-label="Email otomatis">
          <h2>Email otomatis</h2>
          <DescriptionList
            items={[
              { label: 'Notifikasi tim', value: emailLine(lead.emailStatus?.notification) },
              { label: 'Balasan otomatis', value: emailLine(lead.emailStatus?.autoReply) },
            ]}
          />
        </section>
      </div>
      <aside className={s.stack} aria-label="Tindak lanjut">
        <a
          className={`${s.button} ${s.primary}`}
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
        >
          Balas lewat WhatsApp
        </a>
        <CmsForm
          action={updateLeadAction}
          initialValue={{ id: lead.id, status: lead.status, notes: lead.notes }}
          submitLabel="Simpan tindak lanjut"
        >
          {(value, setValue, errors) => (
            <div className={s.panel}>
              <label className={s.field}>
                Status
                <select
                  value={value.status}
                  onChange={(event) => setValue({ ...value, status: event.target.value })}
                >
                  {LEAD_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {labels[status]}
                    </option>
                  ))}
                </select>
                {errors.status ? <span className={s.error}>{errors.status}</span> : null}
              </label>
              <label className={s.field}>
                Catatan internal
                <textarea
                  rows={8}
                  maxLength={5000}
                  value={value.notes}
                  onChange={(event) => setValue({ ...value, notes: event.target.value })}
                />
                {errors.notes ? <span className={s.error}>{errors.notes}</span> : null}
              </label>
            </div>
          )}
        </CmsForm>
        <section className={s.panel} aria-label="Hapus data">
          <p className={s.muted}>
            Untuk permintaan penghapusan data (UU PDP). Hapus juga file ekspor lama yang memuat lead
            ini.
          </p>
          <ConfirmAction
            action={deleteLeadAction}
            fields={{ id: lead.id }}
            label="Hapus lead"
            title="Hapus lead permanen"
            description="Data lead ini dihapus permanen dan tidak dapat dikembalikan."
            confirmName={lead.email}
            redirectTo="/admin/leads"
          />
        </section>
      </aside>
    </div>
  )
}
