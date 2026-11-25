'use client'

import { ShoppingBag } from 'lucide-react'
import { useState, useTransition } from 'react'

import { CartLines } from '@/components/order/CartLines'
import { MenuBrowser } from '@/components/order/MenuBrowser'
import { PaymentChoice } from '@/components/order/PaymentChoice'
import { MAX_CART_ITEMS, type MenuSectionView } from '@/components/order/types'
import { useCart } from '@/components/order/useCart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPrice } from '@/lib/content'
import type { PickupDay } from '@/lib/pickup'
import { formatDateFr } from '@/lib/time'
import { cn } from '@/lib/utils'

import { submitTakeaway } from './actions'

export function TakeawayOrder({
  sections,
  days,
  enabled,
  onlinePayment,
}: {
  sections: MenuSectionView[]
  days: PickupDay[]
  enabled: boolean
  onlinePayment: boolean
}) {
  const cart = useCart('lc-panier-emporter', sections)
  const [day, setDay] = useState(days[0]?.date ?? null)
  const [slot, setSlot] = useState<number | null>(null)
  const [payOnline, setPayOnline] = useState(onlinePayment)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const open = enabled && days.length > 0
  const times = days.find((d) => d.date === day)?.times ?? []

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!day || slot === null) return setError('Choisissez une heure de retrait.')
    const f = new FormData(e.currentTarget)
    setError(null)
    start(async () => {
      const res = await submitTakeaway({
        items: cart.payloadItems,
        date: day,
        startMin: slot,
        name: String(f.get('name') ?? ''),
        phone: String(f.get('phone') ?? ''),
        note: String(f.get('note') ?? '') || undefined,
        payOnline,
        website: String(f.get('website') ?? ''),
      })
      if (!res.ok) return setError(res.error)
      cart.clear()
      window.location.assign(res.redirect)
    })
  }

  return (
    <div className="space-y-12">
      {!open && (
        <p className="border-l-2 border-brand-red pl-4" role="status">
          La commande à emporter n’est pas disponible pour le moment. La carte reste consultable ci-dessous.
        </p>
      )}

      <section aria-labelledby="choix">
        <h2 id="choix" className="mb-4 text-3xl">
          1. Vos envies
        </h2>
        <MenuBrowser
          sections={sections}
          canAdd={open}
          stickyTop="top-16"
          onAdd={(item, options) => setError(cart.add(item, options) ? null : `${MAX_CART_ITEMS} articles maximum.`)}
          qtyInCart={(id) => cart.lines.filter((l) => l.itemId === id).reduce((s, l) => s + l.qty, 0)}
        />
      </section>

      {open && cart.count > 0 && (
        <form onSubmit={onSubmit} id="valider" className="frame space-y-8 border border-border p-6 sm:p-8">
          <section aria-labelledby="panier">
            <h2 id="panier" className="mb-2 text-3xl">
              2. Votre panier
            </h2>
            <CartLines lines={cart.lines} onChange={cart.changeQty} />
          </section>

          <fieldset>
            <legend className="mb-4 font-display text-3xl font-light">3. Retrait</legend>
            {days.length > 1 && (
              <div className="mb-3 flex gap-2">
                {days.map((d) => (
                  <button
                    key={d.date}
                    type="button"
                    aria-pressed={day === d.date}
                    onClick={() => {
                      setDay(d.date)
                      setSlot(null)
                    }}
                    className={cn('rounded-md border px-4 py-2 text-sm capitalize', day === d.date ? 'border-foreground bg-foreground text-background' : 'border-border')}
                  >
                    {formatDateFr(d.date, { month: undefined })}
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {times.map((t) => (
                <button
                  key={t.startMin}
                  type="button"
                  aria-pressed={slot === t.startMin}
                  onClick={() => setSlot(t.startMin)}
                  className={cn(
                    'h-11 rounded-md border tabular-nums',
                    slot === t.startMin ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/60',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-4 font-display text-3xl font-light">4. Vos coordonnées</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="t-name">Nom</Label>
                <Input id="t-name" name="name" autoComplete="name" required className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-phone">Téléphone</Label>
                <Input id="t-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required className="h-12" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-note">Une précision ? (facultatif)</Label>
              <Input id="t-note" name="note" maxLength={300} className="h-12" />
            </div>
            <div aria-hidden className="absolute left-[-9999px] h-0 overflow-hidden">
              <input name="website" tabIndex={-1} autoComplete="off" />
            </div>
            <p className="text-xs text-muted-foreground">Vous cumulez 1 point de fidélité par euro, crédité au retrait.</p>
          </fieldset>

          <PaymentChoice value={payOnline} onChange={setPayOnline} onlineAvailable={onlinePayment} onSiteLabel="Payer au retrait" />

          {error && (
            <p role="alert" className="text-accent">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? 'Envoi…' : payOnline ? `Payer ${formatPrice(cart.total)}` : `Commander · ${formatPrice(cart.total)}`}
          </Button>
        </form>
      )}

      {open && cart.count > 0 && (
        <a
          href="#valider"
          className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-between rounded-md bg-foreground px-5 py-4 text-background shadow-lg md:hidden"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="size-5" /> Valider ({cart.count})
          </span>
          <span className="tabular-nums">{formatPrice(cart.total)}</span>
        </a>
      )}
    </div>
  )
}
