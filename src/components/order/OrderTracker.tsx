'use client'

import { Check } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { getTrackedOrderStatus, retryPayment, type TrackAuth } from '@/lib/actions/orders'
import { cn } from '@/lib/utils'

const LABELS: Record<string, Record<string, string>> = {
  table: { recue: 'Reçue au bar', en_preparation: 'En préparation', servie: 'Servie' },
  precommande: { programmee: 'Enregistrée', recue: 'Lancée à votre arrivée', en_preparation: 'En préparation', servie: 'Servie' },
  emporter: { programmee: 'Enregistrée', recue: 'Transmise au bar', en_preparation: 'En préparation', servie: 'Remise' },
}

const PAYMENT_LABEL: Record<string, string> = {
  a_regler: 'À régler sur place',
  en_attente: 'Paiement en ligne en attente',
  payee: 'Payée en ligne',
  remboursee: 'Remboursée',
}

/** Suivi en direct : interroge le statut toutes les 5 s tant que la commande n'est pas terminée. */
export function OrderTracker({
  id,
  type,
  auth,
  initialStatus,
  initialPayment,
  returnPath,
}: {
  id: number
  type: 'table' | 'precommande' | 'emporter'
  auth: TrackAuth
  initialStatus: string
  initialPayment: string
  returnPath: string
}) {
  const [status, setStatus] = useState(initialStatus)
  const [payment, setPayment] = useState(initialPayment)
  const [paying, startPay] = useTransition()

  useEffect(() => {
    if (status === 'servie' || status === 'annulee') return
    const timer = setInterval(async () => {
      if (document.hidden) return
      const res = await getTrackedOrderStatus(id, auth)
      if (res) {
        setStatus(res.status)
        setPayment(res.paymentStatus)
      }
    }, 5000)
    return () => clearInterval(timer)
  }, [id, auth, status])

  if (status === 'annulee') {
    return (
      <p role="status" className="border-l-2 border-brand-red pl-4">
        Cette commande a été annulée. Demandez à l’équipe si besoin.
      </p>
    )
  }

  const steps = Object.entries(LABELS[type])
  const current = steps.findIndex(([value]) => value === status)

  return (
    <div className="space-y-6">
      <ol className="space-y-4" aria-live="polite">
        {steps.map(([value, label], i) => {
          const done = i <= current
          return (
            <li key={value} className="flex items-center gap-4">
              <span
                className={cn(
                  'inline-flex size-9 items-center justify-center rounded-full border',
                  done ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground',
                  i === current && status !== 'servie' && 'animate-pulse',
                )}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={cn('text-lg', !done && 'text-muted-foreground')}>{label}</span>
            </li>
          )
        })}
      </ol>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <span className={cn('text-sm', payment === 'payee' ? 'text-success' : 'text-muted-foreground')}>{PAYMENT_LABEL[payment] ?? payment}</span>
        {payment === 'en_attente' && (
          <Button
            size="sm"
            disabled={paying}
            onClick={() =>
              startPay(async () => {
                const url = await retryPayment(id, auth, returnPath)
                if (url) window.location.assign(url)
              })
            }
          >
            {paying ? 'Redirection…' : 'Finaliser le paiement'}
          </Button>
        )}
      </div>
    </div>
  )
}
