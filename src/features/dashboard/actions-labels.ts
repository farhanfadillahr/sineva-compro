/** Indonesian phrases for the activity feed. */
const ENTITY: Record<string, string> = {
  pages: 'halaman',
  services: 'layanan',
  posts: 'artikel',
  portfolio: 'karya',
  faq: 'FAQ',
  product: 'produk',
  team: 'anggota tim',
  categories: 'kategori',
  media: 'media',
  settings: 'pengaturan situs',
  email_settings: 'pengaturan email',
  redirects: 'redirect',
  users: 'pengguna',
  leads: 'lead',
  waitlist: 'waitlist',
  profile: 'profil',
}
const ACTION: Record<string, string> = {
  create: 'menambah',
  update: 'mengubah',
  delete: 'menghapus',
  publish: 'menerbitkan',
  unpublish: 'membatalkan terbit',
  activate: 'mengaktifkan',
  deactivate: 'menonaktifkan',
  password_change: 'mengganti password',
}

export function activityPhrase(action: string, entity: string) {
  return `${ACTION[action] ?? action} ${ENTITY[entity] ?? entity}`
}

export function deltaLabel(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 'Sama dengan periode sebelumnya' : 'Naik dari 0'
  const change = Math.round(((current - previous) / previous) * 100)
  return change === 0
    ? 'Sama dengan periode sebelumnya'
    : `${change > 0 ? '+' : ''}${change}% dari periode sebelumnya`
}
