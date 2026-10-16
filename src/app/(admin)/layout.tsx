import type { ReactNode } from 'react'
import { geistMono, plusJakartaSans } from '@/styles/fonts'
import '../globals.css'

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
