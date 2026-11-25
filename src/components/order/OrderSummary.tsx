import type { Order } from '@/payload-types'

import { formatPrice } from '@/lib/content'

export function OrderSummary({ order }: { order: Order }) {
  return (
    <>
      <ul className="mt-10 divide-y divide-border border-y border-border">
        {order.items.map((i) => (
          <li key={i.id ?? i.title} className="flex justify-between gap-4 py-3">
            <span>
              {i.qty} × {i.title}
              {i.options && <span className="block text-sm text-muted-foreground">{i.options}</span>}
            </span>
            <span className="tabular-nums">{formatPrice(i.qty * i.unitPrice)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex justify-between text-lg">
        <span>Total</span>
        <span className="font-display tabular-nums">{formatPrice(order.total ?? 0)}</span>
      </p>
      {order.note && <p className="mt-2 text-sm text-muted-foreground">Note : {order.note}</p>}
    </>
  )
}
