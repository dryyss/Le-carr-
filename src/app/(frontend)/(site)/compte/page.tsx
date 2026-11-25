import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getCurrentCustomer } from '@/lib/customer-session'
import { getPayloadClient, getSettings } from '@/lib/payload'
import { formatPhoneFr } from '@/lib/phone'
import { formatDateTimeFr } from '@/lib/time'

import { deleteAccount, logout } from './actions'
import { ProfileForm } from './ProfileForm'

export const metadata: Metadata = { title: 'Mon compte fidélité', robots: { index: false } }
export const dynamic = 'force-dynamic'

const TX_LABEL: Record<string, string> = {
  gain: 'Points gagnés',
  utilisation: 'Récompense utilisée',
  bonus_anniversaire: 'Bonus anniversaire',
  ajustement: 'Ajustement',
}

export default async function ComptePage({ searchParams }: { searchParams: Promise<{ suppression?: string }> }) {
  const customer = await getCurrentCustomer()
  if (!customer) redirect('/connexion?next=/compte')
  const { suppression } = await searchParams

  const payload = await getPayloadClient()
  const [settings, rewards, history] = await Promise.all([
    getSettings(),
    payload.find({ collection: 'rewards', where: { active: { equals: true } }, sort: 'pointsCost', limit: 50, depth: 0 }),
    payload.find({ collection: 'loyalty-transactions', where: { customer: { equals: customer.id } }, sort: '-createdAt', limit: 20, depth: 0 }),
  ])
  const points = customer.points ?? 0
  const nextReward = rewards.docs.find((r) => r.pointsCost > points)

  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <p className="kicker mb-3">Fidélité</p>
      <h1 className="mb-10 text-5xl">Bonjour{customer.firstName ? ` ${customer.firstName}` : ''}</h1>

      {/* Carte de fidélité */}
      <section className="frame mb-12 border border-border p-8" aria-labelledby="solde">
        <h2 id="solde" className="kicker mb-2">
          Votre solde
        </h2>
        <p className="font-display text-7xl font-light tabular-nums">
          {points}
          <span className="ml-2 text-2xl text-muted-foreground">pts</span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {settings.loyalty?.pointsPerEuro ?? 1} point par euro commandé à table. Pensez à donner votre numéro en commandant.
        </p>
        {nextReward && (
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm">
              <span>Prochaine récompense : {nextReward.title}</span>
              <span className="tabular-nums text-muted-foreground">
                {points} / {nextReward.pointsCost}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuemin={0} aria-valuemax={nextReward.pointsCost} aria-valuenow={points}>
              <div className="h-full bg-foreground" style={{ width: `${Math.min(100, (points / nextReward.pointsCost) * 100)}%` }} />
            </div>
          </div>
        )}
      </section>

      {/* Récompenses */}
      <section className="mb-12" aria-labelledby="recompenses">
        <h2 id="recompenses" className="mb-4 text-3xl">
          Récompenses
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">À demander à l’équipe sur place : elle les déduit de votre solde.</p>
        <ul className="divide-y divide-border border-y border-border">
          {rewards.docs.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="text-lg">{r.title}</p>
                {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
              </div>
              <span className={`shrink-0 text-sm tabular-nums ${r.pointsCost <= points ? 'text-success' : 'text-muted-foreground'}`}>
                {r.pointsCost} pts{r.pointsCost <= points ? ' · disponible' : ''}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Historique */}
      <section className="mb-12" aria-labelledby="historique">
        <h2 id="historique" className="mb-4 text-3xl">
          Historique
        </h2>
        {history.docs.length === 0 ? (
          <p className="text-muted-foreground">Rien pour l’instant. Vos points apparaîtront ici après votre première commande.</p>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {history.docs.map((t) => (
              <li key={t.id} className="flex justify-between gap-4 py-3 text-sm">
                <div>
                  <p>{TX_LABEL[t.type]}</p>
                  <p className="text-muted-foreground">
                    <span className="capitalize-first">{formatDateTimeFr(t.createdAt, { hour: undefined, minute: undefined })}</span>
                    {t.reason ? ` · ${t.reason}` : ''}
                  </p>
                </div>
                <span className={`tabular-nums ${(t.points ?? 0) > 0 ? 'text-success' : ''}`}>
                  {(t.points ?? 0) > 0 ? '+' : ''}
                  {t.points}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Profil */}
      <section className="mb-12" aria-labelledby="profil">
        <h2 id="profil" className="mb-1 text-3xl">
          Mes informations
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">Connecté avec le {formatPhoneFr(customer.phone)}</p>
        <ProfileForm customer={customer} />
      </section>

      <section className="space-y-6 border-t border-border pt-8">
        <form action={logout}>
          <Button type="submit" variant="outline">
            Se déconnecter
          </Button>
        </form>
        <details className="text-sm" open={suppression === 'confirmer'}>
          <summary className="cursor-pointer text-muted-foreground">Supprimer mon compte</summary>
          <form action={deleteAccount} className="mt-4 max-w-sm space-y-3">
            <p className="text-muted-foreground">
              Vos points et votre historique seront effacés définitivement. Tapez SUPPRIMER pour confirmer.
            </p>
            <Label htmlFor="confirm" className="sr-only">
              Confirmation
            </Label>
            <Input id="confirm" name="confirm" autoComplete="off" className="h-11" />
            <Button type="submit" variant="destructive">
              Supprimer définitivement
            </Button>
          </form>
        </details>
      </section>
    </div>
  )
}
