'use client'

import { useActionState } from 'react'

import type { Customer } from '@/payload-types'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { updateProfile, type ProfileState } from './actions'

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

export function ProfileForm({ customer }: { customer: Customer }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, null)
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom</Label>
          <Input id="firstName" name="firstName" defaultValue={customer.firstName ?? ''} autoComplete="given-name" className="h-12" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom</Label>
          <Input id="lastName" name="lastName" defaultValue={customer.lastName ?? ''} autoComplete="family-name" className="h-12" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" defaultValue={customer.email ?? ''} autoComplete="email" className="h-12" />
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Anniversaire (un cadeau vous attend)</legend>
        <div className="grid grid-cols-2 gap-3">
          <select
            name="birthdayDay"
            aria-label="Jour"
            defaultValue={customer.birthdayDay ?? ''}
            className="h-12 rounded-md border border-input bg-background px-3"
          >
            <option value="">Jour</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            name="birthdayMonth"
            aria-label="Mois"
            defaultValue={customer.birthdayMonth ?? ''}
            className="h-12 rounded-md border border-input bg-background px-3"
          >
            <option value="">Mois</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </fieldset>
      <fieldset className="space-y-3 border-t border-border pt-5 text-sm">
        <legend className="sr-only">Consentements</legend>
        <label className="flex items-start gap-3">
          <input type="checkbox" name="optInSms" defaultChecked={Boolean(customer.optInSms)} className="mt-0.5 size-5 accent-foreground" />
          <span>Recevoir les offres et soirées par SMS</span>
        </label>
        <label className="flex items-start gap-3">
          <input type="checkbox" name="optInEmail" defaultChecked={Boolean(customer.optInEmail)} className="mt-0.5 size-5 accent-foreground" />
          <span>Recevoir les offres par e-mail</span>
        </label>
      </fieldset>
      {state?.error && (
        <p role="alert" className="text-accent">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-success">
          Enregistré.
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Enregistrement…' : 'Enregistrer'}
      </Button>
    </form>
  )
}
