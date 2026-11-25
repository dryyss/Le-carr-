'use client'

import Link from 'next/link'

import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="contenu" className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-5 text-center">
      <Logo className="size-24" />
      <h1 className="text-5xl">Petit souci</h1>
      <p className="text-muted-foreground">Quelque chose s’est mal passé de notre côté. Réessayez dans un instant.</p>
      <div className="flex gap-3">
        <Button size="lg" onClick={reset}>
          Réessayer
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Accueil</Link>
        </Button>
      </div>
    </main>
  )
}
