'use client'

import { Check } from 'lucide-react'
import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { submitPrivatization, type PrivState } from './actions'

export function PrivatizationForm() {
  const [state, action, pending] = useActionState<PrivState, FormData>(submitPrivatization, null)

  if (state?.ok) {
    return (
      <div className="frame border border-border p-10" role="status">
        <Check className="mb-4 size-8" aria-hidden />
        <h2 className="mb-2 text-3xl">Demande envoyée</h2>
        <p className="text-muted-foreground">Merci ! On revient vers vous très vite, par téléphone ou par e-mail.</p>
      </div>
    )
  }

  return (
    <form action={action} className="frame space-y-5 border border-border p-6 sm:p-10">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="p-name">Nom</Label>
          <Input id="p-name" name="name" autoComplete="name" required className="h-12" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-phone">Téléphone</Label>
          <Input id="p-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required className="h-12" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="p-email">E-mail</Label>
        <Input id="p-email" name="email" type="email" autoComplete="email" className="h-12" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="p-date">Date souhaitée</Label>
          <Input id="p-date" name="date" type="date" required className="h-12" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-guests">Nombre d’invités</Label>
          <Input id="p-guests" name="guests" type="number" inputMode="numeric" min={2} max={300} required className="h-12" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="p-occasion">Occasion</Label>
        <Input id="p-occasion" name="occasion" placeholder="Anniversaire, soirée d’entreprise…" className="h-12" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="p-message">Votre message</Label>
        <Textarea id="p-message" name="message" rows={5} maxLength={2000} />
      </div>
      <div aria-hidden className="absolute left-[-9999px] h-0 overflow-hidden">
        <label>
          Site web <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {state?.error && (
        <p role="alert" className="border-l-2 border-brand-red pl-4 text-accent">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Envoi…' : 'Envoyer ma demande'}
      </Button>
      <p className="text-xs text-muted-foreground">Vos coordonnées servent uniquement à répondre à cette demande.</p>
    </form>
  )
}
