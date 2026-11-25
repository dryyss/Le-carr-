'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'

import { MenuTags } from '@/components/site/MenuTags'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/content'

import type { ItemView, MenuSectionView } from './types'

/** Carte cliquable : bouton « + » par produit, options dépliables. */
export function MenuBrowser({
  sections,
  onAdd,
  canAdd = true,
  stickyTop = 'top-0',
  qtyInCart,
}: {
  sections: MenuSectionView[]
  onAdd: (item: ItemView, options: string[]) => void
  canAdd?: boolean
  stickyTop?: string
  qtyInCart?: (itemId: number) => number
}) {
  const [openItem, setOpenItem] = useState<number | null>(null)
  const [picked, setPicked] = useState<string[]>([])

  function add(item: ItemView, options: string[]) {
    onAdd(item, options)
    setOpenItem(null)
    setPicked([])
  }

  return (
    <div>
      <nav aria-label="Catégories" className={`sticky ${stickyTop} z-30 -mx-5 mb-6 overflow-x-auto border-y border-border bg-background/95 px-5 py-3 backdrop-blur`}>
        <ul className="flex gap-2 whitespace-nowrap">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#cat-${s.slug}`} className="inline-block rounded-full border border-border px-4 py-1.5 text-sm hover:border-foreground">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-10">
        {sections.map((s) => (
          <section key={s.id} id={`cat-${s.slug}`} className="scroll-mt-32" aria-labelledby={`c-${s.id}`}>
            <h3 id={`c-${s.id}`} className="font-display text-3xl font-light">
              {s.title}
            </h3>
            {s.note && <p className="text-sm text-muted-foreground">{s.note}</p>}
            <ul className="mt-3">
              {s.items.map((item) => {
                const isOpen = openItem === item.id
                const inCart = qtyInCart?.(item.id) ?? 0
                return (
                  <li key={item.id} className="border-b border-border py-4">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-lg leading-snug">
                          {item.title}
                          {inCart > 0 && <span className="ml-2 rounded-sm bg-foreground px-1.5 text-xs text-background tabular-nums">{inCart}</span>}
                        </p>
                        {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                        <MenuTags tags={item.tags as never} />
                        <p className="font-display tabular-nums">{formatPrice(item.price)}</p>
                      </div>
                      {canAdd && (
                        <button
                          type="button"
                          aria-label={`Ajouter ${item.title}`}
                          aria-expanded={item.options.length ? isOpen : undefined}
                          onClick={() => {
                            if (item.options.length) {
                              setOpenItem(isOpen ? null : item.id)
                              setPicked([])
                            } else add(item, [])
                          }}
                          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-foreground/50 transition-colors hover:bg-foreground hover:text-background"
                        >
                          <Plus className="size-5" />
                        </button>
                      )}
                    </div>
                    {isOpen && (
                      <fieldset className="mt-4 space-y-2 rounded-md border border-border p-4">
                        <legend className="px-1 text-sm text-muted-foreground">Options</legend>
                        {item.options.map((o) => (
                          <label key={o.name} className="flex items-center justify-between gap-3 py-1">
                            <span className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                className="size-5 accent-foreground"
                                checked={picked.includes(o.name)}
                                onChange={(e) => setPicked((p) => (e.target.checked ? [...p, o.name] : p.filter((x) => x !== o.name)))}
                              />
                              {o.name}
                            </span>
                            {o.supplement > 0 && <span className="text-sm text-muted-foreground">+{formatPrice(o.supplement)}</span>}
                          </label>
                        ))}
                        <Button type="button" className="mt-2 w-full" onClick={() => add(item, picked)}>
                          Ajouter
                        </Button>
                      </fieldset>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
