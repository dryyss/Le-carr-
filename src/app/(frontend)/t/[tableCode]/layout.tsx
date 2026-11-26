import type { Metadata } from 'next'
import Link from 'next/link'

import { Logo } from '@/components/Logo'
import { isDemo } from '@/lib/demo'

export const metadata: Metadata = { title: 'Commander à table', robots: { index: false } }

export default function TableLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {isDemo() && <p className="bg-brand-red px-4 py-1 text-center text-xs text-white">Démo : la commande n’est pas réellement préparée.</p>}
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-5">
          <Link href="/" aria-label="Le Carré, accueil" className="flex min-h-11 items-center gap-2">
            <Logo className="size-8" />
            <span className="font-display text-xs uppercase tracking-[0.35em]">Le Carré</span>
          </Link>
        </div>
      </header>
      <main id="contenu">{children}</main>
    </>
  )
}
