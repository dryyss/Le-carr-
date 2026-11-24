import Link from 'next/link'

import { Button } from '@/components/ui/button'

// Page provisoire du jalon 1 : la vitrine complète arrive au jalon 2.
export default function HomePage() {
  return (
    <section className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-accent">Saint-Brice-sous-Forêt</p>
      <h1 className="text-5xl font-semibold sm:text-6xl">Le Carré</h1>
      <p className="text-lg text-muted-foreground">Lounge et salon de thé. Le site arrive très bientôt.</p>
      <Button asChild size="lg">
        <Link href="/admin">Espace équipe</Link>
      </Button>
    </section>
  )
}
