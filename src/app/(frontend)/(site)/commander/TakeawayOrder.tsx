'use client'

import { ShoppingBag, X } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'

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

/**
 * Commande à emporter. Écran large : carte à gauche, panier collant à droite.
 * Mobile : barre « Voir le panier » en bas, panier en plein écran.
 */
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
  const [showCart, setShowCart] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const open = enabled && days.length > 0
  const times = days.find((d) => d.date === day)?.times ?? []

  // panier mobile ouvert : on bloque le défilement de la page derrière
  useEffect(() => {
    if (!showCart) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setShowCart(false)
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [showCart])

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
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <section aria-labelledby="choix" className="min-w-0">
        {!open && (
          <p className="mb-6 border-l-2 border-brand-red pl-4" role="status">
            La commande à emporter n’est pas disponible pour le moment. La carte reste consultable.
          </p>
        )}
        <h2 id="choix" className="sr-only">
          La carte
        </h2>
        <MenuBrowser
          sections={sections}
          canAdd={open}
          stickyTop="top-16"
          onAdd={(item, options) => setError(cart.add(item, options) ? null : `${MAX_CART_ITEMS} articles maximum.`)}
          qtyInCart={cart.qtyOf}
          onRemove={cart.removeOne}
        />
      </section>

      {/* Panier : colonne collante en écran large, plein écran sur mobile */}
      {open && (
        <aside
          aria-labelledby="panier-titre"
          className={cn(
            'lg:sticky lg:top-24 lg:block lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:rounded-md lg:border lg:border-border',
            showCart ? 'fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background lg:z-auto' : 'hidden',
          )}
        >
          <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background px-5">
            <h2 id="panier-titre" className="font-display text-2xl font-light">
              Votre commande{cart.count > 0 && <span className="text-muted-foreground"> ({cart.count})</span>}
            </h2>
            <button
              type="button"
              aria-label="Fermer le panier"
              onClick={() => setShowCart(false)}
              className="inline-flex size-11 items-center justify-center lg:hidden"
            >
              <X />
            </button>
          </div>

          <form onSubmit={onSubmit} className="flex-1 space-y-7 px-5 py-5">
            {cart.count === 0 ? (
              <p className="text-muted-foreground">Votre panier est vide. Touchez + à côté d’un produit pour l’ajouter.</p>
            ) : (
              <>
                <CartLines lines={cart.lines} onChange={cart.changeQty} />
                <p className="flex justify-between text-lg">
                  <span>Total</span>
                  <span className="font-display tabular-nums">{formatPrice(cart.total)}</span>
                </p>

                <fieldset>
                  <legend className="mb-3 text-sm font-medium">Heure de retrait</legend>
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
                          className={cn(
                            'h-10 rounded-md border px-4 text-sm capitalize',
                            day === d.date ? 'border-foreground bg-foreground text-background' : 'border-border',
                          )}
                        >
                          {formatDateFr(d.date, { month: undefined })}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-2">
                    {times.map((t) => (
                      <button
                        key={t.startMin}
                        type="button"
                        aria-pressed={slot === t.startMin}
                        onClick={() => setSlot(t.startMin)}
                        className={cn(
                          'h-11 rounded-md border text-sm tabular-nums',
                          slot === t.startMin ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/60',
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="space-y-4">
                  <legend className="mb-3 text-sm font-medium">Vos coordonnées</legend>
                  <div className="space-y-2">
                    <Label htmlFor="t-name">Nom</Label>
                    <Input id="t-name" name="name" autoComplete="name" required className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="t-phone">Téléphone</Label>
                    <Input id="t-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="t-note">Une précision ? (facultatif)</Label>
                    <Input id="t-note" name="note" maxLength={300} className="h-12" />
                  </div>
                  <div aria-hidden className="absolute left-[-9999px] h-0 overflow-hidden">
                    <input name="website" tabIndex={-1} autoComplete="off" />
                  </div>
                  <p className="text-xs text-muted-foreground">1 point de fidélité par euro, crédité au retrait.</p>
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
              </>
            )}
          </form>
        </aside>
      )}

      {/* barre panier mobile */}
      {open && cart.count > 0 && !showCart && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-4 backdrop-blur lg:hidden">
          <Button size="lg" className="flex w-full justify-between" onClick={() => setShowCart(true)}>
            <span className="flex items-center gap-2">
              <ShoppingBag /> Voir le panier ({cart.count})
            </span>
            <span className="tabular-nums">{formatPrice(cart.total)}</span>
          </Button>
        </div>
      )}
    </div>
  )
}
