'use client'

import { useMemo } from 'react'

function parisDate(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(d)
}

/** Raccourcis de filtre au-dessus de la liste des réservations (aujourd'hui par défaut via le menu). */
export function ReservationQuickFilters() {
  const links = useMemo(() => {
    const base = '/admin/collections/reservations'
    const today = parisDate()
    return [
      { label: 'Aujourd’hui', href: `${base}?where[date][equals]=${today}&sort=startsAt` },
      { label: 'Demain', href: `${base}?where[date][equals]=${parisDate(1)}&sort=startsAt` },
      { label: 'À venir', href: `${base}?where[date][greater_than_equal]=${today}&sort=startsAt` },
      { label: 'Toutes', href: `${base}?sort=-startsAt` },
    ]
  }, [])

  return (
    <nav className="lc-toolbar" aria-label="Filtres rapides">
      {links.map((l) => (
        <a key={l.label} className="btn btn--style-secondary btn--size-small" href={l.href}>
          {l.label}
        </a>
      ))}
    </nav>
  )
}
