'use client'
import { useId, useState } from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import { id } from 'date-fns/locale'
import { format, startOfMonth, subDays } from 'date-fns'
import { Dialog } from './overlays'
import s from './admin.module.css'
type SingleProps = {
  mode?: 'single' | 'datetime'
  value?: string
  onChange: (value: string | undefined) => void
}
type RangeProps = {
  mode: 'range'
  value?: { from?: string; to?: string }
  onChange: (value: { from?: string; to?: string } | undefined) => void
}
export function DatePicker(
  props: (SingleProps | RangeProps) & { label: string; name?: string; disabled?: boolean },
) {
  const [open, setOpen] = useState(false)
  const inputId = useId()
  const range = props.mode === 'range'
  const selected = range ? undefined : props.value ? new Date(props.value as string) : undefined
  const selectedRange =
    range && props.value
      ? {
          from: props.value.from ? new Date(props.value.from) : undefined,
          to: props.value.to ? new Date(props.value.to) : undefined,
        }
      : undefined
  const valid = (date: Date | undefined) =>
    date && !Number.isNaN(date.getTime()) ? date : undefined
  const date = valid(selected)
  const label = range
    ? selectedRange?.from
      ? `${format(selectedRange.from, 'd MMM yyyy', { locale: id })}${selectedRange.to ? ` - ${format(selectedRange.to, 'd MMM yyyy', { locale: id })}` : ''}`
      : 'Pilih rentang'
    : date
      ? format(date, props.mode === 'datetime' ? 'd MMM yyyy, HH:mm' : 'd MMM yyyy', { locale: id })
      : 'Pilih tanggal'
  const labels = {
    labelNav: () => 'Navigasi kalender',
    labelNext: () => 'Bulan berikutnya',
    labelPrevious: () => 'Bulan sebelumnya',
    labelDayButton: (date: Date, modifiers: { today?: boolean; selected?: boolean }) =>
      `${format(date, 'PPPP', { locale: id })}${modifiers.today ? ', hari ini' : ''}${modifiers.selected ? ', dipilih' : ''}`,
    labelMonthDropdown: () => 'Pilih bulan',
    labelYearDropdown: () => 'Pilih tahun',
  }
  const classes = { root: s.calendar, selected: s.calendarSelected, today: s.calendarToday }
  function selectRange(value: DateRange | undefined) {
    if (props.mode === 'range')
      props.onChange(
        value ? { from: value.from?.toISOString(), to: value.to?.toISOString() } : undefined,
      )
  }
  return (
    <div className={s.field}>
      <span id={inputId}>{props.label}</span>
      <button
        className={s.button}
        type="button"
        aria-label={`${props.label}: ${label}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={props.disabled}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      {props.name ? (
        <input
          type="hidden"
          name={props.name}
          value={
            range ? JSON.stringify(props.value ?? {}) : ((props.value as string | undefined) ?? '')
          }
        />
      ) : null}
      <Dialog open={open} onClose={() => setOpen(false)} title={props.label}>
        {range ? (
          <>
            <div className={s.row}>
              {[
                ['Hari ini', new Date()],
                ['7 hari', subDays(new Date(), 6)],
                ['30 hari', subDays(new Date(), 29)],
                ['Bulan ini', startOfMonth(new Date())],
              ].map(([label, from]) => (
                <button
                  className={s.button}
                  key={String(label)}
                  type="button"
                  onClick={() => selectRange({ from: from as Date, to: new Date() })}
                >
                  {String(label)}
                </button>
              ))}
            </div>
            <DayPicker
              mode="range"
              locale={id}
              labels={labels}
              weekStartsOn={1}
              classNames={classes}
              selected={selectedRange}
              defaultMonth={selectedRange?.from}
              onSelect={selectRange}
            />
          </>
        ) : (
          <>
            <DayPicker
              mode="single"
              locale={id}
              labels={labels}
              weekStartsOn={1}
              classNames={classes}
              selected={date}
              defaultMonth={date}
              onSelect={(value) => {
                if (value && date && props.mode === 'datetime')
                  value.setHours(date.getHours(), date.getMinutes())
                props.onChange(value?.toISOString())
                if (props.mode !== 'datetime') setOpen(false)
              }}
            />
            {props.mode === 'datetime' ? (
              <label className={s.field}>
                Waktu (24 jam)
                <input
                  type="time"
                  aria-label="Waktu (24 jam)"
                  value={date ? format(date, 'HH:mm') : '00:00'}
                  disabled={!date}
                  onChange={(e) => {
                    if (!date || !e.target.value) return
                    const [hours, minutes] = e.target.value.split(':').map(Number)
                    const next = new Date(date)
                    next.setHours(hours, minutes)
                    props.onChange(next.toISOString())
                  }}
                />
              </label>
            ) : null}
          </>
        )}
        <button
          type="button"
          className={s.button}
          onClick={() => {
            if (props.mode === 'range') props.onChange(undefined)
            else props.onChange(undefined)
            setOpen(false)
          }}
        >
          Kosongkan tanggal
        </button>
        <button type="button" className={`${s.button} ${s.primary}`} onClick={() => setOpen(false)}>
          Selesai
        </button>
      </Dialog>
    </div>
  )
}
