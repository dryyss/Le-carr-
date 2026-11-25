'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { MAX_CART_ITEMS, type CartLine, type ItemView, type MenuSectionView } from './types'

/**
 * Panier conservé sur l'appareil (localStorage), filtré sur les produits encore présents à la carte.
 * Les prix affichés sont indicatifs : le serveur les recalcule à la validation.
 */
export function useCart(storageKey: string, sections: MenuSectionView[]) {
  const itemsById = useMemo(() => new Map(sections.flatMap((s) => s.items).map((i) => [i.id, i])), [sections])
  const [lines, setLines] = useState<CartLine[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let saved: CartLine[] = []
    try {
      saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as CartLine[]
    } catch {
      saved = []
    }
    // synchronisation avec le stockage local après le premier rendu (pas disponible côté serveur)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLines(saved.filter((l) => itemsById.has(l.itemId)))
    setHydrated(true)
  }, [storageKey, itemsById])

  useEffect(() => {
    if (hydrated) localStorage.setItem(storageKey, JSON.stringify(lines))
  }, [lines, hydrated, storageKey])

  const count = lines.reduce((s, l) => s + l.qty, 0)
  const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0)

  const add = useCallback(
    (item: ItemView, options: string[]): boolean => {
      if (count >= MAX_CART_ITEMS) return false
      const key = `${item.id}|${[...options].sort().join('|')}`
      const unitPrice = item.price + item.options.filter((o) => options.includes(o.name)).reduce((s, o) => s + o.supplement, 0)
      setLines((c) => {
        const existing = c.find((l) => l.key === key)
        if (existing) return c.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l))
        return [...c, { key, itemId: item.id, title: item.title, options, unitPrice, qty: 1 }]
      })
      return true
    },
    [count],
  )

  const changeQty = useCallback(
    (key: string, delta: number) => {
      if (delta > 0 && count >= MAX_CART_ITEMS) return
      setLines((c) => c.map((l) => (l.key === key ? { ...l, qty: l.qty + delta } : l)).filter((l) => l.qty > 0))
    },
    [count],
  )

  const clear = useCallback(() => {
    setLines([])
    localStorage.removeItem(storageKey)
  }, [storageKey])

  const payloadItems = lines.map((l) => ({ menuItemId: l.itemId, qty: l.qty, options: l.options }))

  return { lines, count, total, add, changeQty, clear, payloadItems }
}
