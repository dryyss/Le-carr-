'use client'

import { Bell, BellOff, PackageX, Wifi, WifiOff } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'

import { Logo } from '@/components/Logo'
import type { BarOrder } from '@/lib/bar'
import { cn } from '@/lib/utils'

import { advanceOrder, cancelOrder, markPaidAtCounter, setAvailability } from './actions'

type ProductGroup = { category: string; items: { id: number; title: string; available: boolean }[] }

const SERVED_VISIBLE_MS = 30 * 60_000
const COLUMNS: { status: BarOrder['status']; title: string; action?: string }[] = [
  { status: 'recue', title: 'Reçues', action: 'Préparer' },
  { status: 'en_preparation', title: 'En préparation', action: 'Servie' },
  { status: 'servie', title: 'Servies (30 min)' },
]

const timeFmt = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' })

const TYPE_LABEL: Record<BarOrder['type'], string> = { table: '', precommande: 'Précommande', emporter: 'À emporter' }

function PaymentBadge({ status }: { status: BarOrder['paymentStatus'] }) {
  if (status === 'payee') return <span className="rounded-sm bg-success px-2 py-0.5 text-base font-semibold text-black">Payée</span>
  if (status === 'en_attente') return <span className="rounded-sm border border-white/40 px-2 py-0.5 text-base">Paiement en cours</span>
  return <span className="rounded-sm border border-white/40 px-2 py-0.5 text-base">À encaisser</span>
}

function beep(ctx: AudioContext) {
  const now = ctx.currentTime
  ;[0, 0.18].forEach((offset, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = i ? 1320 : 880
    gain.gain.setValueAtTime(0.0001, now + offset)
    gain.gain.exponentialRampToValueAtTime(0.4, now + offset + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.16)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now + offset)
    osc.stop(now + offset + 0.18)
  })
}

export function BarBoard({
  initialOrders,
  since,
  userName,
  products,
}: {
  initialOrders: BarOrder[]
  since: string
  userName: string
  products: ProductGroup[]
}) {
  const [orders, setOrders] = useState<Map<number, BarOrder>>(() => new Map(initialOrders.map((o) => [o.id, o])))
  const [connected, setConnected] = useState(false)
  const [soundOn, setSoundOn] = useState(false)
  const [showStock, setShowStock] = useState(false)
  const [stock, setStock] = useState(products)
  const [now, setNow] = useState(() => Date.now())
  const [, start] = useTransition()
  const audio = useRef<AudioContext | null>(null)
  const soundRef = useRef(false)
  const known = useRef(new Set(initialOrders.map((o) => o.id)))

  const merge = useCallback((incoming: BarOrder[]) => {
    let fresh = false
    setOrders((prev) => {
      const next = new Map(prev)
      for (const o of incoming) {
        if (!known.current.has(o.id)) {
          known.current.add(o.id)
          if (o.status === 'recue') fresh = true
        }
        next.set(o.id, o)
      }
      return next
    })
    if (fresh && soundRef.current && audio.current) beep(audio.current)
  }, [])

  // flux temps réel
  useEffect(() => {
    const es = new EventSource(`/api/bar/stream?since=${encodeURIComponent(since)}`)
    es.addEventListener('open', () => setConnected(true))
    es.addEventListener('error', () => setConnected(false))
    es.addEventListener('orders', (e) => merge(JSON.parse((e as MessageEvent<string>).data) as BarOrder[]))
    return () => es.close()
  }, [since, merge])

  // horloge pour masquer les servies au bout de 30 min
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  function toggleSound() {
    if (!audio.current) audio.current = new AudioContext()
    void audio.current.resume()
    const next = !soundOn
    setSoundOn(next)
    soundRef.current = next
    if (next) beep(audio.current)
  }

  function act(fn: () => Promise<BarOrder | null>) {
    start(async () => {
      const updated = await fn()
      if (updated) merge([updated])
    })
  }

  function toggleItem(id: number, available: boolean) {
    setStock((groups) => groups.map((g) => ({ ...g, items: g.items.map((i) => (i.id === id ? { ...i, available } : i)) })))
    start(() => setAvailability(id, available))
  }

  const visible = [...orders.values()].filter(
    (o) => o.status !== 'annulee' && (o.status !== 'servie' || (o.servedAt && now - Date.parse(o.servedAt) < SERVED_VISIBLE_MS)),
  )
  const upcoming = visible
    .filter((o) => o.status === 'programmee')
    .sort((a, b) => Date.parse(a.scheduledFor ?? a.createdAt) - Date.parse(b.scheduledFor ?? b.createdAt))
  const outOfStock = stock.flatMap((g) => g.items).filter((i) => !i.available).length

  return (
    <div className="flex min-h-dvh flex-col text-white">
      <header className="flex items-center justify-between gap-4 border-b border-white/15 px-6 py-3">
        <div className="flex items-center gap-3">
          <Logo className="size-10" />
          <span className="font-display text-xl uppercase tracking-[0.3em]">Bar</span>
        </div>
        <div className="flex items-center gap-3 text-lg">
          <span className={cn('flex items-center gap-2', connected ? 'text-success' : 'text-accent')} role="status">
            {connected ? <Wifi /> : <WifiOff />} {connected ? 'En direct' : 'Reconnexion…'}
          </span>
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundOn}
            className={cn('flex h-12 items-center gap-2 rounded-md border px-4', soundOn ? 'border-white bg-white text-black' : 'border-white/30')}
          >
            {soundOn ? <Bell /> : <BellOff />} {soundOn ? 'Son activé' : 'Activer le son'}
          </button>
          <button
            type="button"
            onClick={() => setShowStock((s) => !s)}
            aria-expanded={showStock}
            className="flex h-12 items-center gap-2 rounded-md border border-white/30 px-4"
          >
            <PackageX /> Ruptures{outOfStock ? ` (${outOfStock})` : ''}
          </button>
          <span className="text-white/60 max-lg:hidden">{userName}</span>
        </div>
      </header>

      {showStock && (
        <section aria-label="Ruptures de stock" className="max-h-[45vh] overflow-y-auto border-b border-white/15 bg-neutral-950 px-6 py-4">
          <p className="mb-3 text-white/70">Touchez un produit pour le retirer de la carte (rupture) ou le remettre.</p>
          <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-4">
            {stock.map((g) => (
              <div key={g.category}>
                <h2 className="mb-2 font-display text-lg uppercase tracking-widest text-white/60">{g.category}</h2>
                <ul className="space-y-1.5">
                  {g.items.map((i) => (
                    <li key={i.id}>
                      <button
                        type="button"
                        onClick={() => toggleItem(i.id, !i.available)}
                        aria-pressed={!i.available}
                        className={cn(
                          'flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-lg',
                          i.available ? 'border-white/20' : 'border-brand-red bg-brand-red/25 line-through',
                        )}
                      >
                        {i.title}
                        <span className="text-sm no-underline">{i.available ? 'Dispo' : 'Rupture'}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section aria-labelledby="a-venir" className="border-b border-white/15 px-6 py-3">
          <h2 id="a-venir" className="mb-2 font-display text-lg uppercase tracking-widest text-white/70">
            À venir ({upcoming.length}) : précommandes et à emporter
          </h2>
          <ul className="flex gap-3 overflow-x-auto pb-1">
            {upcoming.map((o) => (
              <li key={o.id} className="min-w-72 rounded-lg border border-white/30 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-2xl tabular-nums">n° {o.number}</span>
                  <span className="text-xl tabular-nums">{o.scheduledFor ? timeFmt.format(new Date(o.scheduledFor)) : ''}</span>
                </div>
                <p className="text-lg">
                  {TYPE_LABEL[o.type]} · {o.contact ?? ''}
                </p>
                <p className="mb-2 text-white/70">{o.items.map((i) => `${i.qty} × ${i.title}`).join(', ')}</p>
                <div className="flex items-center justify-between gap-2">
                  <PaymentBadge status={o.paymentStatus} />
                  <button type="button" onClick={() => act(() => advanceOrder(o.id))} className="h-11 rounded-md bg-white px-4 text-lg font-semibold text-black">
                    Lancer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <main className="grid flex-1 gap-px bg-white/15 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const list = visible
            .filter((o) => o.status === col.status)
            .sort((a, b) => (col.status === 'servie' ? Date.parse(b.servedAt ?? '') - Date.parse(a.servedAt ?? '') : Date.parse(a.createdAt) - Date.parse(b.createdAt)))
          return (
            <section key={col.status} aria-labelledby={`col-${col.status}`} className="flex flex-col bg-black">
              <h1 id={`col-${col.status}`} className="flex items-center justify-between border-b border-white/15 px-5 py-3 font-display text-2xl uppercase tracking-widest">
                {col.title}
                <span className="tabular-nums text-white/60">{list.length}</span>
              </h1>
              <ul className="flex-1 space-y-4 overflow-y-auto p-4">
                {list.length === 0 && <li className="py-10 text-center text-xl text-white/40">Rien pour l’instant</li>}
                {list.map((o) => {
                  const waitMin = Math.floor((now - Date.parse(o.createdAt)) / 60_000)
                  return (
                    <li
                      key={o.id}
                      className={cn(
                        'rounded-lg border-2 p-4',
                        o.status === 'recue' ? 'border-white' : o.status === 'en_preparation' ? 'border-white/50' : 'border-white/15 opacity-70',
                        o.status !== 'servie' && waitMin >= 15 && 'border-brand-red',
                      )}
                    >
                      <div className="mb-3 flex items-baseline justify-between gap-3">
                        <span className="font-display text-4xl tabular-nums">n° {o.number}</span>
                        <span className="text-right text-2xl font-medium">{o.table ?? `${TYPE_LABEL[o.type]} · ${o.contact ?? ''}`}</span>
                      </div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {o.type !== 'table' && o.table && <span className="rounded-sm border border-white/40 px-2 py-0.5 text-base">{TYPE_LABEL[o.type]}</span>}
                        <PaymentBadge status={o.paymentStatus} />
                        {o.paymentStatus !== 'payee' && (
                          <button type="button" onClick={() => act(() => markPaidAtCounter(o.id))} className="rounded-sm border border-white/40 px-2 py-0.5 text-base underline">
                            Encaissée
                          </button>
                        )}
                      </div>
                      <p className="mb-3 text-lg text-white/70 tabular-nums">
                        {timeFmt.format(new Date(o.createdAt))}
                        {o.status !== 'servie' && ` · il y a ${waitMin} min`}
                      </p>
                      <ul className="mb-3 space-y-1 text-2xl">
                        {o.items.map((i, idx) => (
                          <li key={idx}>
                            <strong className="tabular-nums">{i.qty} ×</strong> {i.title}
                            {i.options && <span className="block pl-10 text-lg text-white/70">{i.options}</span>}
                          </li>
                        ))}
                      </ul>
                      {o.note && <p className="mb-3 rounded-md bg-white/10 px-3 py-2 text-xl">« {o.note} »</p>}
                      {col.action && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => act(() => advanceOrder(o.id))}
                            className="h-16 flex-1 rounded-md bg-white text-2xl font-semibold text-black active:scale-[0.99]"
                          >
                            {col.action}
                          </button>
                          {o.status === 'recue' && (
                            <button
                              type="button"
                              onClick={() => confirm(`Annuler la commande n° ${o.number} ?`) && act(() => cancelOrder(o.id))}
                              className="h-16 rounded-md border border-white/30 px-4 text-lg"
                            >
                              Annuler
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </main>
    </div>
  )
}
