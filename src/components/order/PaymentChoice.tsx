'use client'

import { CreditCard, Store } from 'lucide-react'

import { cn } from '@/lib/utils'

/** Choix du mode de paiement : en ligne (carte) ou sur place. */
export function PaymentChoice({
  value,
  onChange,
  onlineAvailable,
  onSiteLabel = 'Payer sur place',
}: {
  value: boolean
  onChange: (payOnline: boolean) => void
  onlineAvailable: boolean
  onSiteLabel?: string
}) {
  const options = [
    { online: true, label: 'Payer en ligne', hint: 'Carte bancaire, paiement sécurisé', icon: CreditCard, disabled: !onlineAvailable },
    { online: false, label: onSiteLabel, hint: 'En caisse, au moment de partir', icon: Store, disabled: false },
  ]
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-medium">Paiement</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <label
            key={o.label}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-40',
              value === o.online ? 'border-foreground' : 'border-border hover:border-foreground/50',
            )}
          >
            <input
              type="radio"
              name="payment"
              className="mt-1 size-4 accent-foreground"
              checked={value === o.online}
              disabled={o.disabled}
              onChange={() => onChange(o.online)}
            />
            <span>
              <span className="flex items-center gap-2">
                <o.icon className="size-4" aria-hidden /> {o.label}
              </span>
              <span className="block text-xs text-muted-foreground">{o.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
