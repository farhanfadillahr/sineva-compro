import type { ReactNode } from 'react'
import '../globals.css'
import styles from '@/components/admin/admin.module.css'

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body className={styles.root}>{children}</body>
    </html>
  )
}
