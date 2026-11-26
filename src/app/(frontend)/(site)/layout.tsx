import React from 'react'

import { CustomCursor } from '@/components/motion/CustomCursor'
import { IntroLoader } from '@/components/motion/IntroLoader'
import { ScrollEffects } from '@/components/motion/ScrollEffects'
import { Footer } from '@/components/site/Footer'
import { Header } from '@/components/site/Header'
import { JsonLd } from '@/components/site/JsonLd'
import { isDemo } from '@/lib/demo'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <IntroLoader />
      <CustomCursor />
      <ScrollEffects />
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
