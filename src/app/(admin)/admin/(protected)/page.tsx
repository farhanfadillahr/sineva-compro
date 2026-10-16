import Link from 'next/link'
import { headers } from 'next/headers'
import { PageHeader } from '@/components/admin/shell'
import { ActivityFeed, EmptyState, ListCard, StatCard } from '@/components/admin/display'
import { loadDashboard, RANGES, readRange } from '@/features/dashboard/service.server'
import { activityPhrase, deltaLabel } from '@/features/dashboard/actions-labels'
import {
  LeadsAreaChart,
  LeadsBarChart,
  Sparkline,
  StatusDonut,
} from '@/features/dashboard/components/charts'
import c from '@/features/dashboard/components/dashboard.module.css'
import s from '@/components/admin/admin.module.css'

export const metadata = { title: 'Dasbor' }

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[] }>
}) {
  const days = readRange((await searchParams).range)
  const data = await loadDashboard(await headers(), days)
  const { principal, leads } = data
  return (
    <main className={s.stack}>
      <PageHeader
        title={`Halo, ${principal.name}.`}
        description={
          principal.role === 'admin'
            ? 'Yang perlu perhatian: lead baru, waitlist, draf dan terjemahan.'
            : 'Draf yang menunggu, terjemahan yang belum ada dan aktivitas konten.'
        }
        actions={
          leads ? (
            <nav className={s.row} aria-label="Rentang waktu">
              {RANGES.map((range) => (
                <Link
                  key={range}
                  className={s.chip}
                  href={`/admin?range=${range}`}
                  aria-current={range === days ? 'page' : undefined}
                >
                  {range} hari
                </Link>
              ))}
            </nav>
          ) : null
        }
      />
      <div className={c.grid}>
        {leads ? (
          <>
            <StatCard
              label={`Lead baru (${days} hari)`}
              value={leads.leads.value}
              delta={deltaLabel(leads.leads.value, leads.leads.previous)}
              href="/admin/leads?status=new"
            >
              <Sparkline values={leads.leads.sparkline} />
            </StatCard>
            <StatCard
              label={`Waitlist (${days} hari)`}
              value={leads.waitlist.value}
              delta={deltaLabel(leads.waitlist.value, leads.waitlist.previous)}
              href="/admin/waitlist"
            >
              <Sparkline values={leads.waitlist.sparkline} />
            </StatCard>
          </>
        ) : null}
        <StatCard label="Draf menunggu terbit" value={data.drafts.length} href="/admin/blog" />
        <StatCard label="Terjemahan belum ada" value={data.missing.count} />
      </div>
      {leads ? (
        <>
          <LeadsAreaChart series={leads.series} days={days} />
          <div className={c.wide}>
            <LeadsBarChart title="Lead per layanan" data={leads.perService} />
            <LeadsBarChart title="Lead per jenis bisnis" data={leads.perSegment} />
            <StatusDonut data={leads.perStatus} />
          </div>
        </>
      ) : null}
      <div className={c.wide}>
        {leads ? (
          leads.latest.length ? (
            <ListCard
              title="Lead terbaru"
              href="/admin/leads"
              items={leads.latest.map((l) => ({
                id: l.id,
                title: l.name,
                href: `/admin/leads/${l.id}`,
                meta: `${l.interest} · ${new Date(l.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`,
              }))}
            />
          ) : (
            <section className={s.panel}>
              <h2>Lead terbaru</h2>
              <EmptyState message="Belum ada lead." />
            </section>
          )
        ) : null}
        {data.drafts.length ? (
          <ListCard
            title="Draf menunggu"
            items={data.drafts
              .slice(0, 5)
              .map((d) => ({ id: d.id, title: d.title, href: d.href, meta: d.kind }))}
          />
        ) : (
          <section className={s.panel}>
            <h2>Draf menunggu</h2>
            <EmptyState message="Tidak ada draf yang menunggu." />
          </section>
        )}
        <section className={s.panel}>
          <h2>Aktivitas terbaru</h2>
          {data.feed.length ? (
            <ActivityFeed
              items={data.feed.map((f) => ({
                id: f.id,
                actor: f.actor,
                action: activityPhrase(f.action, f.entity),
                date: f.date,
              }))}
            />
          ) : (
            <EmptyState message="Belum ada aktivitas." />
          )}
        </section>
      </div>
    </main>
  )
}
