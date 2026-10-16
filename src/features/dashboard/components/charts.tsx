'use client'
import { useId, useState, type ReactNode } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { usePrefersReducedMotion } from '@/lib/motion/reduced-motion'
import { EmptyState } from '@/components/admin/display'
import s from '@/components/admin/admin.module.css'
import c from './dashboard.module.css'

/** Chart colours come from the brand tokens only (admin-ui.md 4.4). */
const TOKENS = {
  line: 'var(--color-text-brand)',
  bar: 'var(--color-action-primary)',
  grid: 'var(--color-border)',
  axis: 'var(--color-text-tertiary)',
  previous: 'var(--color-border-input)',
}
const STATUS_COLORS: Record<string, string> = {
  new: 'var(--color-text-brand)',
  contacted: 'var(--admin-warning)',
  qualified: 'var(--color-focus)',
  won: 'var(--color-success)',
  lost: 'var(--color-text-tertiary)',
}
const STATUS_LABELS: Record<string, string> = {
  new: 'Baru',
  contacted: 'Dihubungi',
  qualified: 'Berpotensi',
  won: 'Berhasil',
  lost: 'Tidak lanjut',
}

/** A chart with its text summary for screen readers and a table alternative. */
function ChartFrame({
  title,
  summary,
  table,
  empty,
  children,
}: {
  title: string
  summary: string
  table: { head: string[]; rows: (string | number)[][] }
  empty: boolean
  children: ReactNode
}) {
  const id = useId()
  const [asTable, setAsTable] = useState(false)
  return (
    <section className={`${s.panel} ${s.stack}`} aria-labelledby={`${id}-title`}>
      <div className={s.sectionHeader}>
        <h2 id={`${id}-title`}>{title}</h2>
        {empty ? null : (
          <button
            type="button"
            className={s.button}
            aria-pressed={asTable}
            onClick={() => setAsTable((v) => !v)}
          >
            {asTable ? 'Lihat sebagai grafik' : 'Lihat sebagai tabel'}
          </button>
        )}
      </div>
      <p id={`${id}-summary`} className={s.srOnly}>
        {summary}
      </p>
      {empty ? (
        <EmptyState message="Belum ada data untuk periode ini." />
      ) : asTable ? (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                {table.head.map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={c.chart} role="img" aria-describedby={`${id}-summary`}>
          {children}
        </div>
      )}
    </section>
  )
}

export function LeadsAreaChart({
  series,
  days,
}: {
  series: { day: string; leads: number; previous: number }[]
  days: number
}) {
  const reduced = usePrefersReducedMotion()
  const gradient = useId().replace(/:/g, '')
  const total = series.reduce((sum, p) => sum + p.leads, 0)
  const previous = series.reduce((sum, p) => sum + p.previous, 0)
  return (
    <ChartFrame
      title={`Lead per hari (${days} hari)`}
      summary={`${total} lead dalam ${days} hari terakhir, dibanding ${previous} pada periode sebelumnya.`}
      table={{
        head: ['Tanggal', 'Lead', 'Periode sebelumnya'],
        rows: series.map((p) => [p.day, p.leads, p.previous]),
      }}
      empty={total === 0 && previous === 0}
    >
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-focus)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--color-focus)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={TOKENS.grid} strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            tick={{ fill: TOKENS.axis, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: TOKENS.axis, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="previous"
            name="Periode sebelumnya"
            stroke={TOKENS.previous}
            strokeDasharray="4 4"
            fill="none"
            isAnimationActive={!reduced}
          />
          <Area
            type="monotone"
            dataKey="leads"
            name="Lead"
            stroke={TOKENS.line}
            strokeWidth={2}
            fill={`url(#${gradient})`}
            activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
            isAnimationActive={!reduced}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}

export function LeadsBarChart({
  title,
  data,
}: {
  title: string
  data: { label: string; value: number }[]
}) {
  const reduced = usePrefersReducedMotion()
  return (
    <ChartFrame
      title={title}
      summary={data.map((d) => `${d.label}: ${d.value}`).join(', ') || 'Belum ada data.'}
      table={{ head: ['Kategori', 'Lead'], rows: data.map((d) => [d.label, d.value]) }}
      empty={!data.length}
    >
      <ResponsiveContainer width="100%" height={Math.max(160, data.length * 40)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
          <CartesianGrid horizontal={false} stroke={TOKENS.grid} strokeDasharray="3 3" />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: TOKENS.axis, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={130}
            tick={{ fill: TOKENS.axis, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip />
          <Bar
            dataKey="value"
            name="Lead"
            fill={TOKENS.bar}
            radius={[0, 6, 6, 0]}
            isAnimationActive={!reduced}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}

export function StatusDonut({ data }: { data: { status: string; value: number }[] }) {
  const reduced = usePrefersReducedMotion()
  const total = data.reduce((sum, d) => sum + d.value, 0)
  return (
    <ChartFrame
      title="Lead per status"
      summary={`${total} lead: ${data.map((d) => `${STATUS_LABELS[d.status] ?? d.status} ${d.value}`).join(', ')}.`}
      table={{
        head: ['Status', 'Lead'],
        rows: data.map((d) => [STATUS_LABELS[d.status] ?? d.status, d.value]),
      }}
      empty={total === 0}
    >
      <div className={c.donut}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="status"
              innerRadius={60}
              outerRadius={90}
              isAnimationActive={!reduced}
            >
              {data.map((d) => (
                <Cell key={d.status} fill={STATUS_COLORS[d.status] ?? TOKENS.bar} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <span className={c.donutTotal} aria-hidden>
          {total}
        </span>
      </div>
      <ul className={c.legend} aria-label="Buka daftar lead per status">
        {data.map((d) => (
          <li key={d.status}>
            <a className={s.chip} href={`/admin/leads?status=${d.status}`}>
              <span
                className={c.swatch}
                style={{ background: STATUS_COLORS[d.status] }}
                aria-hidden
              />
              {STATUS_LABELS[d.status] ?? d.status} {d.value}
            </a>
          </li>
        ))}
      </ul>
    </ChartFrame>
  )
}

/** Tiny area sparkline for stat cards; decorative (the card states the number). */
export function Sparkline({ values }: { values: number[] }) {
  const gradient = useId().replace(/:/g, '')
  if (!values.some((v) => v > 0)) return null
  return (
    <div className={c.sparkline} aria-hidden>
      <ResponsiveContainer width="100%" height={40}>
        <AreaChart data={values.map((value, index) => ({ index, value }))}>
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(0,148,155,.28)" />
              <stop offset="100%" stopColor="rgba(0,148,155,0)" />
            </linearGradient>
          </defs>
          <Area
            dataKey="value"
            stroke={TOKENS.line}
            fill={`url(#${gradient})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
