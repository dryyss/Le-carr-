'use client'

import { ShoppingBag, X } from 'lucide-react'
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

import { submitOrder } from './actions'

export function TableMenu({
  table,
  sections,
  closedReason,
  customerName,
  onlinePayment,
}: {
  table: { code: string; label: string; token: string }
  sections: MenuSectionView[]
  closedReason: string | null
  customerName: string | null
  onlinePayment: boolean
}) {
  const cart = useCart(`lc-panier-table-${table.code}`, sections)
  const [showCart, setShowCart] = useState(false)
  const [note, setNote] = useState('')
  const [phone, setPhone] = useState('')
  const [payOnline, setPayOnline] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const canOrder = !closedReason

  function send() {
    setError(null)
    start(async () => {
      const res = await submitOrder({
        tableCode: table.code,
        token: table.token,
        items: cart.payloadItems,
        note: note || undefined,
        phone: phone || undefined,
        payOnline,
      })
      if (!res.ok) return setError(res.error)
      cart.clear()
      window.location.assign(res.redirect)
    })
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pb-32 pt-6">
      <p className="kicker">{table.label}</p>
      <h1 className="mb-2 text-4xl">La carte</h1>
      {closedReason ? (
        <p className="mb-6 border-l-2 border-brand-red pl-4 text-sm" role="status">
          {closedReason}
        </p>
      ) : (
        <p className="mb-6 text-sm text-muted-foreground">Ajoutez vos envies, on vous sert à table. Paiement en ligne ou en caisse.</p>
      )}

      <MenuBrowser
        sections={sections}
        canAdd={canOrder}
        onAdd={(item, options) => setError(cart.add(item, options) ? null : `${MAX_CART_ITEMS} articles maximum par commande.`)}
        qtyInCart={(id) => cart.lines.filter((l) => l.itemId === id).reduce((s, l) => s + l.qty, 0)}
      />

      <p className="mt-10 text-xs text-muted-foreground">L’abus d’alcool est dangereux pour la santé, à consommer avec modération.</p>

      {cart.count > 0 && !showCart && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-4 backdrop-blur">
          <Button size="lg" className="mx-auto flex w-full max-w-2xl justify-between" onClick={() => setShowCart(true)}>
            <span className="flex items-center gap-2">
              <ShoppingBag /> Voir le panier ({cart.count})
            </span>
            <span className="tabular-nums">{formatPrice(cart.total)}</span>
          </Button>
        </div>
      )}

      {showCart && (
        <div role="dialog" aria-modal="true" aria-labelledby="panier-titre" className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex h-14 items-center justify-between border-b border-border px-5">
            <h2 id="panier-titre" className="text-2xl">
              Votre commande
            </h2>
            <button type="button" aria-label="Fermer le panier" onClick={() => setShowCart(false)} className="inline-flex size-11 items-center justify-center">
              <X />
            </button>
          </div>
          <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 overflow-y-auto px-5 py-4">
            <CartLines lines={cart.lines} onChange={cart.changeQty} />
            <div className="space-y-2">
              <Label htmlFor="note">Une précision pour le bar ? (facultatif)</Label>
              <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Sans glaçons, à servir ensemble…" className="h-12" />
            </div>
            <div className="space-y-2">
              {customerName ? (
                <p className="text-sm">Les points de fidélité seront crédités sur votre compte.</p>
              ) : (
                <>
                  <Label htmlFor="phone">Votre numéro pour cumuler des points (facultatif)</Label>
                  <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12" />
                  <p className="text-xs text-muted-foreground">1 point par euro, crédité quand la commande est servie.</p>
                </>
              )}
            </div>
            <PaymentChoice value={payOnline} onChange={setPayOnline} onlineAvailable={onlinePayment} onSiteLabel="Payer en caisse" />
          </div>
          <div className="border-t border-border p-4">
            <div className="mx-auto max-w-2xl space-y-3">
              <div className="flex justify-between text-lg">
                <span>Total</span>
                <span className="font-display tabular-nums">{formatPrice(cart.total)}</span>
              </div>
              {error && (
                <p role="alert" className="text-accent">
                  {error}
                </p>
              )}
              <Button size="lg" className="w-full" disabled={pending || cart.count === 0 || !canOrder} onClick={send}>
                {pending ? 'Envoi…' : payOnline ? `Payer ${formatPrice(cart.total)} et envoyer` : `Envoyer la commande · ${formatPrice(cart.total)}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
