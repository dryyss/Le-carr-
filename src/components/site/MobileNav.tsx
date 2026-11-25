'use client'

import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { NAV } from '@/lib/nav'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="inline-flex size-10 items-center justify-center rounded-md border border-border"
        aria-expanded={open}
        aria-controls="menu-mobile"
        aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {open && (
        <nav
          id="menu-mobile"
          aria-label="Menu"
          className="fixed inset-x-0 top-16 z-50 border-b border-border bg-background px-5 pb-8 pt-4"
        >
          <ul className="flex flex-col">
            {[{ href: '/', label: 'Accueil' }, ...NAV, { href: '/reserver', label: 'Réserver une table' }].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="block border-b border-border py-4 font-display text-2xl font-light"
                  aria-current={pathname === l.href ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}
