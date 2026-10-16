import type { ReactNode } from 'react'
import { geistMono, plusJakartaSans } from '@/styles/fonts'
import '../globals.css'
import styles from '@/components/admin/admin.module.css'

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} ${geistMono.variable}`}>
      <body className={styles.root}>{children}</body>
    </html>
  )
}
