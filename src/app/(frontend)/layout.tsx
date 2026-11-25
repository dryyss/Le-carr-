import type { Metadata, Viewport } from 'next'
import React from 'react'

import { body, display } from '@/lib/fonts'
import { siteUrl } from '@/lib/site-url'

import '@/styles/globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Le Carré · Restaurant lounge à Saint-Brice-sous-Forêt',
    template: '%s · Le Carré',
  },
  description:
    'Restaurant lounge à Saint-Brice-sous-Forêt (95). Burgers, pâtes, mocktails, desserts et soirées. Ouvert 7j/7 de 18h à 2h. Réservez votre table en ligne.',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Le Carré',
    images: [{ url: '/brand/logo.png', width: 400, height: 400, alt: 'Le Carré' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Aller au contenu
        </a>
        {children}
      </body>
    </html>
  )
}
