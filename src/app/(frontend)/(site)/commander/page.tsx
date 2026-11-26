import type { Metadata } from 'next'

import { toSectionViews } from '@/lib/menu-view'
import { getSettings } from '@/lib/payload'
import { onlinePaymentAvailable } from '@/lib/payment'
import { pickupSlots } from '@/lib/pickup'
import { getMenu } from '@/lib/queries'

import { TakeawayOrder } from './TakeawayOrder'

export const metadata: Metadata = {
  title: 'Commander à emporter',
  description: 'Commandez vos plats, mocktails et desserts du Carré à emporter, retrait sur place à l’heure de votre choix.',
}
export const dynamic = 'force-dynamic'

export default async function CommanderPage() {
  const [settings, menu] = await Promise.all([getSettings(), getMenu()])
  return (
    <div className="mx-auto max-w-6xl px-5 pb-28 pt-14 lg:pb-14">
      <p className="kicker mb-3">À emporter</p>
      <h1 className="mb-3 text-5xl">Commander</h1>
      <p className="mb-10 max-w-2xl text-muted-foreground">
        Choisissez vos plats, on les prépare pour l’heure de votre choix. Boissons alcoolisées uniquement sur place.
      </p>
      <TakeawayOrder
        sections={toSectionViews(menu, { excludeAlcohol: true })}
        days={pickupSlots(settings)}
        enabled={Boolean(settings.orderingEnabled)}
        onlinePayment={onlinePaymentAvailable()}
      />
    </div>
  )
}
