'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'

import { CartLines } from '@/components/order/CartLines'
import { MenuBrowser } from '@/components/order/MenuBrowser'
import { PaymentChoice } from '@/components/order/PaymentChoice'
import { MAX_CART_ITEMS, type MenuSectionView } from '@/components/order/types'
import { useCart } from '@/components/order/useCart'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/content'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { serviceWindows, type Closure, type OpeningHour } from '@/lib/opening'
import { addDays, formatDateFr } from '@/lib/time'
import { cn } from '@/lib/utils'

import { createReservationAction, getSlotsAction, type SlotView } from './actions'

type Props = {
  today: string
  openingHours: OpeningHour[]
  closures: Closure[]
  maxPartySize: number
  event: { slug: string; title: string; date: string; when: string } | null
  sections: MenuSectionView[]
  onlinePayment: boolean
}

const DAYS_AHEAD = 30

export function ReservationForm({ today, openingHours, closures, maxPartySize, event, sections, onlinePayment }: Props) {
  const cart = useCart('lc-panier-precommande', sections)
  const [preorder, setPreorder] = useState(false)
  const [payOnline, setPayOnline] = useState(false)
  const [partySize, setPartySize] = useState(2)
  const [tooMany, setTooMany] = useState(false)
  const [date, setDate] = useState<string | null>(event?.date ?? null)
  const [time, setTime] = useState<string | null>(null)
  const [slots, setSlots] = useState<SlotView[] | null>(null)
  const [slotError, setSlotError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingSlots, startSlots] = useTransition()
  const [submitting, startSubmit] = useTransition()

  const dates = useMemo(() => {
    if (event) return [{ date: event.date, open: true }]
    return Array.from({ length: DAYS_AHEAD }, (_, i) => {
      const d = addDays(today, i)
      return { date: d, open: serviceWindows({ openingHours, closures }, d).length > 0 }
    })
  }, [today, openingHours, closures, event])

  useEffect(() => {
    if (!date || tooMany) return
    startSlots(async () => {
      const res = await getSlotsAction({ date, partySize, eventSlug: event?.slug })
      setSlots(res.slots)
      setSlotError(res.error ?? null)
      setTime((t) => (t && res.slots.some((s) => s.time === t && s.available) ? t : null))
    })
  }, [date, partySize, event?.slug, tooMany])

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!date || !time) return
    const f = new FormData(e.currentTarget)
    setError(null)
    startSubmit(async () => {
      const res = await createReservationAction({
        date,
        time,
        partySize,
        name: String(f.get('name') ?? ''),
        phone: String(f.get('phone') ?? ''),
        email: String(f.get('email') ?? ''),
        notes: String(f.get('notes') ?? ''),
        eventSlug: event?.slug,
        optInSms: f.get('optInSms') === 'on',
        optInEmail: f.get('optInEmail') === 'on',
        website: String(f.get('website') ?? ''),
        items: preorder && cart.count > 0 ? cart.payloadItems : undefined,
        payOnline: preorder && cart.count > 0 && payOnline,
      })
      if (!res.ok) return setError(res.error)
      if (preorder) cart.clear()
      window.location.assign(res.redirect)
    })
  }

  const withPreorder = preorder && cart.count > 0

  const sizes = Array.from({ length: Math.min(maxPartySize, 8) }, (_, i) => i + 1)

  return (
    <form onSubmit={onSubmit} className="space-y-12" noValidate>
      {event && (
        <div className="frame border border-border p-5">
          <p className="kicker text-accent">Événement</p>
          <p className="mt-1 text-xl">{event.title}</p>
          <p className="text-sm capitalize text-muted-foreground">{event.when}</p>
        </div>
      )}

      {/* 1. Nombre de personnes */}
      <fieldset>
        <legend className="mb-4 font-display text-2xl">1. Combien serez-vous ?</legend>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-9">
          {sizes.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={!tooMany && partySize === n}
              onClick={() => {
                setTooMany(false)
                setPartySize(n)
              }}
              className={cn(
                'h-12 rounded-md border text-lg tabular-nums transition-colors',
                !tooMany && partySize === n ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/60',
              )}
            >
              {n}
            </button>
          ))}
          {maxPartySize > 8 ? (
            <select
              aria-label="Plus de 8 personnes"
              value={!tooMany && partySize > 8 ? partySize : ''}
              onChange={(e) => {
                const v = e.target.value
                if (v === 'plus') return setTooMany(true)
                setTooMany(false)
                setPartySize(Number(v))
              }}
              className={cn(
                'col-span-2 h-12 rounded-md border bg-background px-3 sm:col-span-1',
                !tooMany && partySize > 8 ? 'border-foreground' : 'border-border',
              )}
            >
              <option value="">9+</option>
              {Array.from({ length: maxPartySize - 8 }, (_, i) => i + 9).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              <option value="plus">Plus de {maxPartySize}</option>
            </select>
          ) : (
            <button
              type="button"
              aria-pressed={tooMany}
              onClick={() => setTooMany(true)}
              className={cn('h-12 rounded-md border', tooMany ? 'border-foreground' : 'border-border')}
            >
              {maxPartySize}+
            </button>
          )}
        </div>
        {tooMany && (
          <p className="mt-4 border-l-2 border-brand-red pl-4 text-sm" role="status">
            Pour un groupe de plus de {maxPartySize} personnes,{' '}
            <Link href="/privatisation" className="underline underline-offset-4">
              faites une demande de privatisation
            </Link>
            . On vous rappelle rapidement.
          </p>
        )}
      </fieldset>

      {!tooMany && (
        <>
          {/* 2. Date */}
          <fieldset>
            <legend className="mb-4 font-display text-2xl">2. Quel jour ?</legend>
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2">
              {dates.map(({ date: d, open }) => {
                const selected = date === d
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={!open}
                    aria-pressed={selected}
                    aria-label={`${formatDateFr(d)}${open ? '' : ', fermé'}`}
                    onClick={() => {
                      setDate(d)
                      setTime(null)
                    }}
                    className={cn(
                      'flex h-20 w-16 shrink-0 flex-col items-center justify-center rounded-md border transition-colors disabled:opacity-30',
                      selected ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/60',
                    )}
                  >
                    <span className="text-xs uppercase">{formatDateFr(d, { weekday: 'short', day: undefined, month: undefined })}</span>
                    <span className="font-display text-2xl tabular-nums">{Number(d.slice(8))}</span>
                    <span className="text-[11px]">{formatDateFr(d, { weekday: undefined, day: undefined, month: 'short' })}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          {/* 3. Heure */}
          {date && (
            <fieldset aria-busy={loadingSlots}>
              <legend className="mb-1 font-display text-2xl">3. À quelle heure ?</legend>
              <p className="mb-4 text-sm capitalize text-muted-foreground">{formatDateFr(date)}</p>
              {loadingSlots && !slots && <p className="text-muted-foreground">Recherche des disponibilités…</p>}
              {slotError && <p className="text-accent">{slotError}</p>}
              {slots && slots.length === 0 && !slotError && (
                <p className="text-muted-foreground">Plus de créneau en ligne ce jour-là. Essayez une autre date ou appelez-nous.</p>
              )}
              {slots && slots.length > 0 && (
                <div className={cn('grid grid-cols-4 gap-2 sm:grid-cols-6', loadingSlots && 'opacity-60')}>
                  {slots.map((s) => (
                    <button
                      key={s.time}
                      type="button"
                      disabled={!s.available}
                      aria-pressed={time === s.time}
                      onClick={() => setTime(s.time)}
                      className={cn(
                        'h-12 rounded-md border tabular-nums transition-colors disabled:line-through disabled:opacity-30',
                        time === s.time ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground/60',
                      )}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              )}
            </fieldset>
          )}

          {/* 4. Coordonnées */}
          {date && time && (
            <fieldset className="space-y-5">
              <legend className="mb-4 font-display text-2xl">4. Vos coordonnées</legend>
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input id="name" name="name" autoComplete="name" required minLength={2} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone mobile</Label>
                <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required className="h-12" aria-describedby="phone-help" />
                <p id="phone-help" className="text-xs text-muted-foreground">
                  Pour la confirmation et le rappel par SMS.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail (facultatif)</Label>
                <Input id="email" name="email" type="email" autoComplete="email" className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Une précision ? (facultatif)</Label>
                <Textarea id="notes" name="notes" maxLength={500} placeholder="Anniversaire, terrasse si possible…" />
              </div>
              {/* honeypot anti-robots */}
              <div aria-hidden className="absolute left-[-9999px] h-0 overflow-hidden">
                <label>
                  Site web <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              <div className="space-y-3 border-t border-border pt-5 text-sm">
                <label className="flex items-start gap-3">
                  <input type="checkbox" name="optInSms" className="mt-0.5 size-5 accent-foreground" />
                  <span>J’accepte de recevoir les offres et soirées du Carré par SMS. Désinscription à tout moment.</span>
                </label>
                <label className="flex items-start gap-3">
                  <input type="checkbox" name="optInEmail" className="mt-0.5 size-5 accent-foreground" />
                  <span>J’accepte de recevoir les offres par e-mail.</span>
                </label>
                <p className="text-xs text-muted-foreground">
                  Les SMS de confirmation et de rappel sont envoyés dans tous les cas.{' '}
                  <Link href="/confidentialite" className="underline">
                    Confidentialité
                  </Link>
                </p>
              </div>

            </fieldset>
          )}

          {/* 5. Précommande facultative */}
          {date && time && (
            <fieldset className="space-y-5">
              <legend className="mb-2 font-display text-2xl">5. Précommander (facultatif)</legend>
              <label className="flex items-start gap-3 rounded-md border border-border p-4">
                <input type="checkbox" checked={preorder} onChange={(e) => setPreorder(e.target.checked)} className="mt-0.5 size-5 accent-foreground" />
                <span>
                  Choisir dès maintenant plats et boissons
                  <span className="block text-sm text-muted-foreground">Ils sont lancés à votre arrivée. Paiement en ligne ou sur place.</span>
                </span>
              </label>
              {preorder && (
                <div className="space-y-6">
                  <MenuBrowser
                    sections={sections}
                    stickyTop="top-16"
                    onAdd={(item, options) => setError(cart.add(item, options) ? null : `${MAX_CART_ITEMS} articles maximum.`)}
                    qtyInCart={(id) => cart.lines.filter((l) => l.itemId === id).reduce((s, l) => s + l.qty, 0)}
                  />
                  <div className="frame border border-border p-5">
                    <h3 className="mb-2 text-2xl">Votre précommande</h3>
                    <CartLines lines={cart.lines} onChange={cart.changeQty} />
                    {cart.count > 0 && (
                      <p className="mt-3 flex justify-between text-lg">
                        <span>Total</span>
                        <span className="font-display tabular-nums">{formatPrice(cart.total)}</span>
                      </p>
                    )}
                  </div>
                  {cart.count > 0 && <PaymentChoice value={payOnline} onChange={setPayOnline} onlineAvailable={onlinePayment} />}
                </div>
              )}

              {error && (
                <p role="alert" className="border-l-2 border-brand-red pl-4 text-accent">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting
                  ? 'Réservation en cours…'
                  : withPreorder && payOnline
                    ? `Réserver et payer ${formatPrice(cart.total)}`
                    : `Réserver pour ${partySize}, à ${time}${withPreorder ? ` + précommande` : ''}`}
              </Button>
            </fieldset>
          )}
        </>
      )}
    </form>
  )
}
