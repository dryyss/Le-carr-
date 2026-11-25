import type { ServerProps } from 'payload'

import { formatPrice } from '@/lib/content'
import { addDays, todayParis, TZ } from '@/lib/time'

const hourFmt = new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' })

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString()
}

/** Tableau de bord du gérant (au-dessus du tableau de bord Payload). */
export async function Dashboard({ payload, user }: ServerProps) {
  if ((user as { role?: string } | undefined)?.role !== 'gerant') {
    return (
      <section className="lc-dash">
        <h2>Bonjour</h2>
        <p className="lc-dash__sub">
          Écran bar : <a href="/bar">/bar</a>. Réservations du jour : menu Salle, puis Réservations.
        </p>
      </section>
    )
  }

  const today = todayParis()
  const tomorrow = addDays(today, 1)
  const since30 = daysAgoIso(30)
  const active = { in: ['en_attente', 'confirmee', 'arrivee'] }

  const [resToday, resTomorrow, ordersTonight, orders30, newCustomers, topCustomers, privatizations] = await Promise.all([
    payload.find({ collection: 'reservations', where: { date: { equals: today }, status: active }, limit: 500, depth: 0, pagination: false }),
    payload.find({ collection: 'reservations', where: { date: { equals: tomorrow }, status: active }, limit: 500, depth: 0, pagination: false }),
    payload.find({
      collection: 'orders',
      where: { serviceDate: { equals: today }, status: { not_equals: 'annulee' } },
      limit: 1000,
      depth: 0,
      pagination: false,
    }),
    payload.find({
      collection: 'orders',
      where: { createdAt: { greater_than_equal: since30 }, status: { not_equals: 'annulee' } },
      limit: 5000,
      depth: 0,
      pagination: false,
      select: { items: true, createdAt: true },
    }),
    payload.count({ collection: 'customers', where: { createdAt: { greater_than_equal: since30 } } }),
    payload.find({ collection: 'customers', sort: '-points', limit: 5, depth: 0, where: { points: { greater_than: 0 } } }),
    payload.find({ collection: 'privatization-requests', where: { status: { equals: 'nouvelle' } }, limit: 5, depth: 0 }),
  ])

  const covers = (docs: { partySize: number }[]) => docs.reduce((s, r) => s + r.partySize, 0)
  const revenueTonight = ordersTonight.docs.reduce((s, o) => s + (o.total ?? 0), 0)

  // top produits sur 30 jours
  const qtyByItem = new Map<string, number>()
  for (const o of orders30.docs) {
    for (const i of o.items ?? []) qtyByItem.set(i.title, (qtyByItem.get(i.title) ?? 0) + i.qty)
  }
  const topItems = [...qtyByItem.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)

  // affluence par heure (commandes), de 16 h à 3 h
  const hours = [16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2]
  const byHour = new Map<number, number>(hours.map((h) => [h, 0]))
  for (const o of orders30.docs) {
    const h = Number(hourFmt.format(new Date(o.createdAt)))
    if (byHour.has(h)) byHour.set(h, (byHour.get(h) ?? 0) + 1)
  }
  const maxHour = Math.max(1, ...byHour.values())

  return (
    <section className="lc-dash" aria-label="Tableau de bord">
      <h2>Ce soir au Carré</h2>
      <p className="lc-dash__sub">Chiffres indicatifs, hors encaissements réels en caisse.</p>

      <div className="lc-dash__grid">
        <div className="lc-dash__card">
          <h3>Réservations ce soir</h3>
          <div className="lc-dash__value">{resToday.totalDocs}</div>
          <div className="lc-dash__sub">{covers(resToday.docs)} couverts attendus</div>
        </div>
        <div className="lc-dash__card">
          <h3>Réservations demain</h3>
          <div className="lc-dash__value">{resTomorrow.totalDocs}</div>
          <div className="lc-dash__sub">{covers(resTomorrow.docs)} couverts attendus</div>
        </div>
        <div className="lc-dash__card">
          <h3>Commandes ce soir</h3>
          <div className="lc-dash__value">{ordersTonight.totalDocs}</div>
          <div className="lc-dash__sub">{formatPrice(revenueTonight)} commandés à table</div>
        </div>
        <div className="lc-dash__card">
          <h3>Nouveaux clients fidélité</h3>
          <div className="lc-dash__value">{newCustomers.totalDocs}</div>
          <div className="lc-dash__sub">sur 30 jours</div>
        </div>
      </div>

      <div className="lc-dash__panels">
        <div className="lc-dash__card">
          <h3>Affluence par heure (commandes, 30 jours)</h3>
          <div className="lc-dash__bars" role="img" aria-label="Nombre de commandes par heure sur 30 jours">
            {hours.map((h) => {
              const v = byHour.get(h) ?? 0
              return (
                <div key={h} className="lc-dash__bar" title={`${h} h : ${v} commande(s)`}>
                  <span style={{ height: `${(v / maxHour) * 100}%` }} />
                  {h}h
                </div>
              )
            })}
          </div>
        </div>

        <div className="lc-dash__card">
          <h3>Top 5 produits (30 jours)</h3>
          <ol className="lc-dash__list">
            {topItems.length === 0 && <li>Aucune commande pour l’instant.</li>}
            {topItems.map(([title, qty]) => (
              <li key={title}>
                <span>{title}</span>
                <span>{qty}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="lc-dash__card">
          <h3>Clients les plus fidèles</h3>
          <ul className="lc-dash__list">
            {topCustomers.docs.length === 0 && <li>Aucun client pour l’instant.</li>}
            {topCustomers.docs.map((c) => (
              <li key={c.id}>
                <a href={`/admin/collections/customers/${c.id}`}>{c.displayName}</a>
                <span>{c.points} pts</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lc-dash__card">
          <h3>Privatisations à traiter</h3>
          <ul className="lc-dash__list">
            {privatizations.docs.length === 0 && <li>Rien en attente.</li>}
            {privatizations.docs.map((p) => (
              <li key={p.id}>
                <a href={`/admin/collections/privatization-requests/${p.id}`}>{p.name}</a>
                <span>{p.guests} pers.</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
