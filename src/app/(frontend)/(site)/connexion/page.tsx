import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getCurrentCustomer } from '@/lib/customer-session'

import { LoginForm } from './LoginForm'

export const metadata: Metadata = { title: 'Connexion', robots: { index: false } }

export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  if (await getCurrentCustomer()) redirect('/compte')
  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <p className="kicker mb-3">Fidélité</p>
      <h1 className="mb-3 text-5xl">Connexion</h1>
      <p className="mb-10 text-muted-foreground">Pas de mot de passe : on vous envoie un code par SMS.</p>
      <LoginForm next={next} />
    </div>
  )
}
