import Link from 'next/link'
import { InlineBanner } from '@/components/admin/feedback'

export type TeamVisibilityState = Readonly<{
  /** Site settings > Fitur situs > "Tampilkan bagian tim di Tentang" (Admin only). */
  featureOn: boolean
  /** Halaman > Tentang > the team section's "Tampilkan bagian ini". */
  sectionOn: boolean
  /** Members with "Tampilkan di halaman Tentang" switched on. */
  shownMembers: number
}>

/**
 * Whether the About page shows the team, with every condition and where to change it (CPR-106).
 * The section appears only when all three are on, and they live on three different screens, so
 * an editor who switched a member on and saw nothing had no way to tell why.
 */
export function TeamVisibility({ featureOn, sectionOn, shownMembers }: TeamVisibilityState) {
  const visible = featureOn && sectionOn && shownMembers > 0
  const checks = [
    {
      ok: featureOn,
      text: 'Fitur "Tampilkan bagian tim di Tentang" menyala',
      href: '/admin/settings',
      where: 'Pengaturan > Situs > Fitur situs (Admin)',
    },
    {
      ok: sectionOn,
      text: 'Bagian tim di halaman Tentang ditampilkan',
      href: '/admin/pages/about',
      where: 'Halaman > Tentang > "Tampilkan bagian ini"',
    },
    {
      ok: shownMembers > 0,
      text: `${shownMembers} anggota memakai "Tampilkan di halaman Tentang"`,
      href: null,
      where: 'Buka anggota di bawah',
    },
  ]
  return (
    <InlineBanner tone={visible ? 'info' : 'warning'}>
      <strong>
        {visible
          ? 'Bagian tim tampil di halaman Tentang.'
          : 'Bagian tim belum tampil di halaman Tentang.'}
      </strong>
      <ul aria-label="Syarat bagian tim tampil">
        {checks.map((check) => (
          <li key={check.text}>
            <span aria-hidden="true">{check.ok ? '✓' : '✗'}</span>{' '}
            <span className="sr-only">{check.ok ? 'Terpenuhi: ' : 'Belum: '}</span>
            {check.text}. {check.href ? <Link href={check.href}>{check.where}</Link> : check.where}
          </li>
        ))}
      </ul>
    </InlineBanner>
  )
}
