import Link from 'next/link'

import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { NAV } from '@/lib/nav'

import { MobileNav } from './MobileNav'

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" className="flex items-center gap-3" aria-label="Le Carré, accueil">
          <Logo className="size-10" />
          <span className="font-display text-sm uppercase tracking-[0.35em] max-sm:hidden">Le Carré</span>
        </Link>
        <nav aria-label="Navigation principale" className="hidden items-center gap-7 md:flex">
          {NAV.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild className="max-md:h-10 max-md:px-4">
            <Link href="/reserver">Réserver</Link>
          </Button>
          <MobileNav />
        </div>
      </div>
    </header>
  )
}
