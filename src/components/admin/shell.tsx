'use client'
import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, Search, ExternalLink } from 'lucide-react'
import type { Principal } from '@/features/auth/types'
import { Sidebar } from './sidebar'
import { Drawer, DropdownMenu } from './overlays'
import { Avatar } from './display'
import { Badge } from './primitives'
import s from './admin.module.css'
const routeLabels: Record<string, string> = {
  admin: 'Ruang kerja',
  users: 'Pengguna',
  new: 'Tambah Editor',
  pages: 'Halaman',
  services: 'Layanan',
  product: 'Produk',
  work: 'Karya',
  blog: 'Artikel',
  categories: 'Kategori',
  faq: 'FAQ',
  team: 'Tim',
  media: 'Media',
  leads: 'Lead',
  waitlist: 'Waitlist',
  settings: 'Pengaturan',
  seo: 'SEO',
  email: 'Email',
  redirects: 'Redirect',
  audit: 'Log audit',
  profil: 'Profil saya',
  ui: 'Galeri antarmuka',
}
export function AdminShell({
  principal,
  children,
  logout,
  searchTrigger,
}: {
  principal: Principal
  children: ReactNode
  logout: ReactNode
  searchTrigger?: ReactNode
}) {
  const pathname = usePathname() ?? '/admin'
  const [drawer, setDrawer] = useState(false)
  const segments = pathname.split('/').filter(Boolean)
  const logo = (
    <Link href="/admin" className={s.logo}>
      <Image src="/brand/sineva-symbol-original.svg" alt="" width={28} height={28} />
      <span className={s.logoText}>Sineva</span>
    </Link>
  )
  const account = (
    <DropdownMenu
      label="Menu akun"
      items={[
        { label: 'Profil saya', href: '/admin/profil' },
        { label: 'Ganti password', href: '/admin/profil#keamanan' },
      ]}
      footer={logout}
    >
      <Avatar name={principal.name} />
      <span className={s.accountName} title={principal.name}>
        {principal.name}
      </span>
    </DropdownMenu>
  )
  return (
    <div className={`${s.root} ${s.shell}`}>
      <a className={`${s.button} ${s.skip}`} href="#admin-main">
        Lewati navigasi
      </a>
      <aside className={s.sidebar} aria-label="Navigasi ruang kerja">
        {logo}
        <Sidebar role={principal.role} pathname={pathname} />
        <div className={s.sideFooter}>
          <span className={s.muted}>
            {principal.name} · {principal.role === 'admin' ? 'Admin' : 'Editor'}
          </span>
        </div>
      </aside>
      <div className={s.workspace}>
        <header className={s.topbar}>
          <div className={s.row}>
            <button
              className={`${s.button} ${s.mobileTrigger}`}
              type="button"
              aria-label="Buka navigasi"
              aria-haspopup="dialog"
              onClick={() => setDrawer(true)}
            >
              <Menu size={18} />
            </button>
            <nav aria-label="Breadcrumb">
              <ol className={s.breadcrumb}>
                {segments.map((part, i) => (
                  <li key={`${part}-${i}`}>
                    {i === segments.length - 1 ? (
                      <span aria-current="page">{routeLabels[part] ?? 'Detail'}</span>
                    ) : (
                      <a href={`/${segments.slice(0, i + 1).join('/')}`}>
                        {routeLabels[part] ?? 'Detail'}
                      </a>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>
          <div className={s.row}>
            {searchTrigger ?? (
              <button
                className={`${s.button} ${s.searchTrigger}`}
                type="button"
                disabled
                title="Pencarian global belum tersedia"
                aria-label="Pencarian global belum tersedia"
              >
                <Search size={16} />
              </button>
            )}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className={`${s.button} ${s.siteLink}`}
            >
              Lihat situs <ExternalLink size={14} aria-hidden />
            </a>
            {account}
          </div>
        </header>
        <div className={s.content} id="admin-main" tabIndex={-1}>
          {children}
        </div>
      </div>
      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Navigasi admin">
        <div className={s.sidebar}>
          {logo}
          <Sidebar role={principal.role} pathname={pathname} onNavigate={() => setDrawer(false)} />
        </div>
      </Drawer>
    </div>
  )
}
export function PageHeader({
  title,
  description,
  status,
  meta,
  actions,
}: {
  title: string
  description?: string
  status?: { label: string; tone?: 'brand' | 'success' | 'warning' | 'danger' }
  meta?: string
  actions?: ReactNode
}) {
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    const scroll = () => setCompact(window.scrollY > 80)
    scroll()
    window.addEventListener('scroll', scroll, { passive: true })
    return () => window.removeEventListener('scroll', scroll)
  }, [])
  return (
    <div className={s.pageHeader} data-compact={compact}>
      <div>
        <div className={s.row}>
          <h1>{title}</h1>
          {status ? <Badge tone={status.tone}>{status.label}</Badge> : null}
        </div>
        <div className={s.headerDetail}>
          {description ? <p className={s.muted}>{description}</p> : null}
          {meta ? <p className={`${s.muted} ${s.mono}`}>{meta}</p> : null}
        </div>
      </div>
      {actions ? <div className={s.row}>{actions}</div> : null}
    </div>
  )
}
export function SectionHeader({
  title,
  helper,
  action,
}: {
  title: string
  helper?: string
  action?: ReactNode
}) {
  return (
    <div className={s.sectionHeader}>
      <div>
        <h2>{title}</h2>
        {helper ? <p className={s.muted}>{helper}</p> : null}
      </div>
      {action}
    </div>
  )
}
export function FormLayout({ children, side }: { children: ReactNode; side: ReactNode }) {
  return (
    <div className={s.formLayout}>
      <div className={s.stack}>{children}</div>
      <aside className={s.stack} aria-label="Status dan publikasi">
        {side}
      </aside>
    </div>
  )
}
