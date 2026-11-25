'use client'

import { Minus, Plus } from 'lucide-react'

import { formatPrice } from '@/lib/content'

import type { CartLine } from './types'

export function CartLines({ lines, onChange }: { lines: CartLine[]; onChange: (key: string, delta: number) => void }) {
  if (!lines.length) return <p className="text-muted-foreground">Panier vide.</p>
  return (
    <ul>
      {lines.map((l) => (
        <li key={l.key} className="flex items-center gap-3 border-b border-border py-4">
          <div className="min-w-0 flex-1">
            <p>{l.title}</p>
            {l.options.length > 0 && <p className="text-sm text-muted-foreground">{l.options.join(', ')}</p>}
            <p className="text-sm tabular-nums text-muted-foreground">{formatPrice(l.unitPrice * l.qty)}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={`Retirer un ${l.title}`}
              onClick={() => onChange(l.key, -1)}
              className="inline-flex size-10 items-center justify-center rounded-full border border-border"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-8 text-center tabular-nums" aria-live="polite">
              {l.qty}
            </span>
            <button
              type="button"
              aria-label={`Ajouter un ${l.title}`}
              onClick={() => onChange(l.key, 1)}
              className="inline-flex size-10 items-center justify-center rounded-full border border-border"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
