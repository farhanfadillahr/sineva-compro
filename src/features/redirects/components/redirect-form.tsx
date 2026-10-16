'use client'
import { CmsForm } from '@/components/admin/cms/cms-form'
import { createRedirectAction } from '../actions'
import s from '@/components/admin/admin.module.css'

export function RedirectForm() {
  return (
    <CmsForm
      action={createRedirectAction}
      initialValue={{ fromPath: '', toPath: '', status: 301 }}
      submitLabel="Tambah redirect"
    >
      {(value, setValue, errors) => (
        <div className={s.panel}>
          <div className={s.row}>
            {(['fromPath', 'toPath'] as const).map((key) => (
              <label key={key} className={s.field}>
                {key === 'fromPath' ? 'Dari path' : 'Ke path'}
                <input
                  value={value[key]}
                  placeholder={key === 'fromPath' ? '/blog/alamat-lama' : '/blog/alamat-baru'}
                  aria-invalid={!!errors[key]}
                  onChange={(event) => setValue({ ...value, [key]: event.target.value })}
                />
                {errors[key] ? <span className={s.error}>{errors[key]}</span> : null}
              </label>
            ))}
            <label className={s.field}>
              Status
              <select
                value={value.status}
                onChange={(event) => setValue({ ...value, status: Number(event.target.value) })}
              >
                <option value={301}>301 (permanen)</option>
                <option value={308}>308 (permanen, metode tetap)</option>
              </select>
            </label>
          </div>
        </div>
      )}
    </CmsForm>
  )
}
