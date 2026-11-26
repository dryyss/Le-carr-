'use client'

import { Check, Minus, Plus } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import { SpotlightCard } from '@/components/motion/SpotlightCard'
import { MenuTags } from '@/components/site/MenuTags'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/content'
import { cn } from '@/lib/utils'

import type { ItemView, MenuSectionView } from './types'

/** Carte interactive avec photos culinaires, halo au survol et options dépliables. */
export function MenuBrowser({
  sections,
  onAdd,
  onRemove,
  canAdd = true,
  stickyTop = 'top-0',
  qtyInCart,
}: {
  sections: MenuSectionView[]
  onAdd: (item: ItemView, options: string[]) => void
  onRemove?: (itemId: number) => void
  canAdd?: boolean
  stickyTop?: string
  qtyInCart?: (itemId: number) => number
}) {
  const [openItem, setOpenItem] = useState<number | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const [justAdded, setJustAdded] = useState<number | null>(null)
  const [activeCat, setActiveCat] = useState<string>(sections[0]?.slug ?? '')

  function add(item: ItemView, options: string[]) {
    onAdd(item, options)
    setOpenItem(null)
    setPicked([])
    setJustAdded(item.id)
    setTimeout(() => setJustAdded((cur) => (cur === item.id ? null : cur)), 650)
  }

  return (
    <div>
      <nav
        aria-label="Catégories"
        className={`no-scrollbar sticky ${stickyTop} z-30 -mx-5 mb-8 overflow-x-auto border-y border-border bg-background/95 px-5 py-3 backdrop-blur-md`}
      >
        <ul className="flex gap-2 whitespace-nowrap">
          {sections.map((s) => {
            const active = activeCat === s.slug
            return (
              <li key={s.id}>
                <a
                  href={`#cat-${s.slug}`}
                  onClick={() => setActiveCat(s.slug)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-all',
                    active
                      ? 'border-brand-red bg-brand-red/15 text-foreground'
                      : 'border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground',
                  )}
                >
                  {s.title}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="space-y-12">
        {sections.map((s) => (
          <section key={s.id} id={`cat-${s.slug}`} className="scroll-mt-32" aria-labelledby={`c-${s.id}`}>
            {/* En-tête visuel de catégorie */}
            <div className="relative mb-5 overflow-hidden rounded-lg border border-border bg-card">
              <div className="relative flex h-24 items-end p-5 sm:h-28">
                <Image
                  src={s.cover}
                  alt={s.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 700px"
                  className="object-cover opacity-40"
                />
                <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-background via-background/80 to-background/20" />
                <div className="relative z-10">
                  <h3 id={`c-${s.id}`} className="font-display text-3xl font-light tracking-wide">
                    {s.title}
                  </h3>
                  {s.note && <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{s.note}</p>}
                </div>
                <span className="relative z-10 ml-auto hidden font-display text-xs uppercase tracking-[0.25em] text-muted-foreground sm:block">
                  {s.items.length} choix
                </span>
              </div>
            </div>

            <ul className="space-y-3">
              {s.items.map((item) => {
                const isOpen = openItem === item.id
                const inCart = qtyInCart?.(item.id) ?? 0
                const addedNow = justAdded === item.id
                return (
                  <li key={item.id}>
                    <SpotlightCard
                      cursorLabel={canAdd ? (item.options.length ? 'CHOISIR' : 'AJOUTER') : undefined}
                      className={cn(
                        'group rounded-lg border bg-card/65 p-3.5 transition-colors sm:p-4',
                        inCart > 0 ? 'border-brand-red/60 bg-card' : 'border-border/80',
                      )}
                    >
                      <div className="flex items-center gap-4">
                        {/* Miniature photo du plat */}
                        <div className="relative size-20 shrink-0 overflow-hidden rounded-md border border-border/70 bg-muted sm:size-24">
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            sizes="96px"
                            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                          />
                          {inCart > 0 && (
                            <span className="animate-pop absolute right-1.5 top-1.5 inline-flex min-w-5 items-center justify-center rounded-sm bg-brand-red px-1.5 py-0.5 text-xs font-semibold text-white tabular-nums shadow">
                              {inCart}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-base font-medium leading-snug sm:text-lg">{item.title}</p>
                          {item.description && <p className="line-clamp-2 text-xs text-muted-foreground sm:text-sm">{item.description}</p>}
                          <MenuTags tags={item.tags as never} />
                          <p className="pt-0.5 font-display text-base tabular-nums text-foreground sm:text-lg">{formatPrice(item.price)}</p>
                        </div>

                        {canAdd && (
                          <div className="flex shrink-0 items-center gap-1.5">
                            {inCart > 0 && onRemove && (
                              <button
                                type="button"
                                aria-label={`Retirer un ${item.title}`}
                                onClick={() => onRemove(item.id)}
                                className="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:border-foreground hover:text-foreground active:scale-90"
                              >
                                <Minus className="size-4" />
                              </button>
                            )}
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
                              className={cn(
                                'inline-flex size-11 shrink-0 items-center justify-center rounded-full border transition-all duration-200 active:scale-90',
                                addedNow
                                  ? 'animate-pop border-success bg-success text-background'
                                  : 'border-foreground/45 text-foreground hover:scale-105 hover:border-brand-red hover:bg-brand-red hover:text-white',
                              )}
                            >
                              {addedNow ? <Check className="size-5" /> : <Plus className="size-5" />}
                            </button>
                          </div>
                        )}
                      </div>

                      {isOpen && (
                        <fieldset className="mt-4 space-y-2 rounded-md border border-border bg-background/80 p-4">
                          <legend className="px-1 text-sm text-muted-foreground">Options</legend>
                          {item.options.map((o) => (
                            <label key={o.name} className="flex items-center justify-between gap-3 py-1">
                              <span className="flex items-center gap-3 text-sm">
                                <input
                                  type="checkbox"
                                  className="size-5 accent-brand-red"
                                  checked={picked.includes(o.name)}
                                  onChange={(e) => setPicked((p) => (e.target.checked ? [...p, o.name] : p.filter((x) => x !== o.name)))}
                                />
                                {o.name}
                              </span>
                              {o.supplement > 0 && <span className="text-sm text-muted-foreground">+{formatPrice(o.supplement)}</span>}
                            </label>
                          ))}
                          <Button type="button" className="mt-2 w-full" onClick={() => add(item, picked)}>
                            Ajouter au panier
                          </Button>
                        </fieldset>
                      )}
                    </SpotlightCard>
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
