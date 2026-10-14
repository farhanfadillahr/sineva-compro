import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: { default: 'Admin Sineva Tech', template: '%s | Admin Sineva Tech' },
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children
}
