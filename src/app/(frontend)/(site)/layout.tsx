import React from 'react'

import { Footer } from '@/components/site/Footer'
import { Header } from '@/components/site/Header'
import { JsonLd } from '@/components/site/JsonLd'
import { isDemo } from '@/lib/demo'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {isDemo() && (
        <p className="bg-brand-red px-4 py-1.5 text-center text-xs text-white">
          Site de démonstration : aucun SMS ni mail n’est envoyé, les données sont fictives.
        </p>
      )}
      <Header />
      <main id="contenu">{children}</main>
      <Footer />
      <JsonLd />
    </>
  )
}
