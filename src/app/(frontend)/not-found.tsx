import Link from 'next/link'

import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main id="contenu" className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-5 text-center">
      <Logo className="size-24" />
      <h1 className="text-5xl">Page introuvable</h1>
      <p className="text-muted-foreground">Ce lien n’existe pas ou plus. Si vous avez scanné un QR code, demandez à l’équipe.</p>
      <Button asChild size="lg">
        <Link href="/">Retour à l’accueil</Link>
      </Button>
    </main>
  )
}
