import type { Metadata, Viewport } from 'next'

import { body, display } from '@/lib/fonts'

import '@/styles/globals.css'

export const metadata: Metadata = { title: 'Écran bar · Le Carré', robots: { index: false } }
export const viewport: Viewport = { themeColor: '#000000', colorScheme: 'dark' }

export default function BarLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh bg-black">{children}</body>
    </html>
  )
}
