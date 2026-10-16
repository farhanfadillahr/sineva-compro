'use client'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import Link from 'next/link'
import {
  ChevronRight,
  FileText,
  Layers,
  LayoutDashboard,
  ImageIcon,
  Users,
  Settings,
  Inbox,
  List,
  type LucideIcon,
} from 'lucide-react'
import type { AdminRole } from '@/features/auth/types'
import s from './admin.module.css'
type Item = {
  label: string
  href?: string
  icon?: LucideIcon
  children?: Item[]
  /** Admin only, inside a group that Editors can see. */
  admin?: boolean
}
const pages = [
  'Beranda',
  'Produk',
  'Layanan',
  'Tentang',
  'Kontak',
  'Terima kasih',
  '404',
  'Privasi',
  'Indeks blog',
  'Indeks karya',
]
const pageIds = [
  'home',
  'product',
  'services',
  'about',
  'contact',
  'thank-you',
  '404',
  'privacy',
  'blog',
  'work',
]
const collections: Item[] = [
  { label: 'Layanan', href: '/admin/services' },
  { label: 'Produk', href: '/admin/product' },
  { label: 'Karya', href: '/admin/work' },
  {
    label: 'Blog',
    children: [
      { label: 'Artikel', href: '/admin/blog' },
      { label: 'Kategori', href: '/admin/blog/categories' },
    ],
  },
  { label: 'FAQ', href: '/admin/faq' },
  { label: 'Tim', href: '/admin/team' },
]
const groups: { label: string; admin?: boolean; items: Item[] }[] = [
  { label: 'Ringkasan', items: [{ label: 'Dasbor', href: '/admin', icon: LayoutDashboard }] },
  {
    label: 'Konten',
    items: [
      {
        label: 'Halaman',
        icon: FileText,
        children: pages.map((label, i) => ({ label, href: `/admin/pages/${pageIds[i]}` })),
      },
      { label: 'Koleksi', icon: Layers, children: collections },
      { label: 'Media', href: '/admin/media', icon: ImageIcon },
    ],
  },
  {
    label: 'Prospek',
    admin: true,
    items: [
      { label: 'Lead', href: '/admin/leads', icon: Inbox },
      { label: 'Waitlist', href: '/admin/waitlist', icon: List },
    ],
  },
  {
    label: 'Pengaturan',
    items: [
      // Editors edit contact, WhatsApp templates and social links (CPR-29).
      { label: 'Situs', href: '/admin/settings', icon: Settings },
      { label: 'SEO', href: '/admin/settings/seo', icon: FileText, admin: true },
      { label: 'Email', href: '/admin/settings/email', icon: Inbox, admin: true },
      { label: 'Redirect', href: '/admin/redirects', icon: List, admin: true },
    ],
  },
  {
    label: 'Sistem',
    admin: true,
    items: [
      { label: 'Pengguna', href: '/admin/users', icon: Users },
      { label: 'Log audit', href: '/admin/audit', icon: List },
    ],
  },
]
const key = 'sineva.admin.navigation.v1'
function active(item: Item, path: string): boolean {
  return (
    !!item.children?.some((i) => active(i, path)) ||
    item.href === path ||
    (!!item.href && item.href != '/admin' && path.startsWith(item.href + '/') && !item.children)
  )
}
function activeBranches(items: Item[], path: string): string[] {
  return items.flatMap((i) =>
    i.children ? [...(active(i, path) ? [i.label] : []), ...activeBranches(i.children, path)] : [],
  )
}
export function Sidebar({
  role,
  pathname,
  onNavigate,
}: {
  role: AdminRole
  pathname: string
  onNavigate?: () => void
}) {
  const visible = groups
    .filter((g) => !g.admin || role === 'admin')
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.admin || role === 'admin') }))
  const trail = activeBranches(
    visible.flatMap((g) => g.items),
    pathname,
  )
  const [expanded, setExpanded] = useState<string[]>(trail)
  const [focused, setFocused] = useState('/admin')
  const tree = useRef<HTMLUListElement>(null)
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
      if (Array.isArray(saved) && saved.every((v) => typeof v === 'string')) {
        // Hydrate persisted presentation after SSR; active branches always remain initially visible.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setExpanded([
          ...new Set([
            ...saved,
            ...activeBranches(
              groups.flatMap((g) => g.items),
              pathname,
            ),
          ]),
        ])
      }
    } catch {
      /* Private mode and malformed storage must not break navigation. */
    }
  }, [pathname])
  function toggle(label: string, open: boolean) {
    setExpanded((old) => {
      const next = open ? [...new Set([...old, label])] : old.filter((v) => v !== label)
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {}
      return next
    })
  }
  function keyboard(e: KeyboardEvent<HTMLUListElement>) {
    const current = (e.target as HTMLElement).closest<HTMLElement>('[role=treeitem]')
    if (!current) return
    const items = Array.from(tree.current?.querySelectorAll<HTMLElement>('[role=treeitem]') ?? [])
    const at = items.indexOf(current)
    let target: HTMLElement | undefined
    if (e.key === 'ArrowDown') target = items[Math.min(at + 1, items.length - 1)]
    else if (e.key === 'ArrowUp') target = items[Math.max(0, at - 1)]
    else if (e.key === 'Home') target = items[0]
    else if (e.key === 'End') target = items.at(-1)
    else if (e.key === 'ArrowRight') {
      if (current.getAttribute('aria-expanded') === 'false') current.click()
      else if (current.hasAttribute('aria-expanded')) target = items[at + 1]
    } else if (e.key === 'ArrowLeft') {
      if (current.getAttribute('aria-expanded') === 'true') current.click()
      else
        target =
          current.parentElement?.parentElement
            ?.closest('li')
            ?.querySelector<HTMLElement>(':scope > [role=treeitem]') ?? undefined
    } else if (e.key === ' ') current.click()
    else if (e.key === 'Enter') return
    else if (e.key.length === 1)
      target = [...items.slice(at + 1), ...items.slice(0, at)].find((i) =>
        i.textContent?.trim().toLocaleLowerCase('id').startsWith(e.key.toLocaleLowerCase('id')),
      )
    else return
    e.preventDefault()
    target?.focus()
  }
  function renderItem(item: Item, level: number) {
    const identity = item.href ?? `branch:${item.label}`
    const open = expanded.includes(item.label)
    const Icon = item.icon
    const isActive = active(item, pathname)
    const props = {
      role: 'treeitem' as const,
      tabIndex: focused === identity ? 0 : -1,
      'aria-level': level,
      'data-trail': isActive || undefined,
      onFocus: () => setFocused(identity),
      className: s.treeItem,
      title: item.label,
      'aria-label': item.label,
    }
    return (
      <li key={item.label} role="none">
        {item.children ? (
          <button
            {...props}
            type="button"
            aria-expanded={open}
            onClick={() => toggle(item.label, !open)}
          >
            {Icon ? <Icon size={18} aria-hidden /> : null}
            <span className={s.navText}>{item.label}</span>
            <ChevronRight className={s.chevron} size={14} aria-hidden />
          </button>
        ) : (
          <Link
            {...props}
            href={item.href!}
            aria-current={isActive ? 'page' : undefined}
            onClick={onNavigate}
          >
            {Icon ? <Icon size={18} aria-hidden /> : null}
            <span className={s.navText}>{item.label}</span>
          </Link>
        )}
        {item.children && open ? (
          <ul role="group" aria-label={item.label}>
            {item.children.map((i) => renderItem(i, level + 1))}
          </ul>
        ) : null}
      </li>
    )
  }
  return (
    <nav aria-label="Menu ruang kerja">
      <ul
        className={s.tree}
        role="tree"
        aria-label="Navigasi admin"
        onKeyDown={keyboard}
        ref={tree}
      >
        {visible.map((g) => (
          <li role="none" key={g.label}>
            <div role="presentation" className={s.groupLabel}>
              {g.label}
            </div>
            <ul role="group" aria-label={g.label}>
              {g.items.map((i) => renderItem(i, 1))}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  )
}
