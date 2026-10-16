import type { ReactNode } from 'react'
import { geistMono, plusJakartaSans } from '@/styles/fonts'
import '../globals.css'
import styles from '@/components/admin/admin.module.css'
import { ThemeScript } from '@/components/theme/theme-script'

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${geistMono.variable}`}
      // The theme script sets data-theme on <html> before React hydrates it.
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className={styles.root}>{children}</body>
    </html>
  )
}
