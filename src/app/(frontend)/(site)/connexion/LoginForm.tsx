'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { maskPhone } from '@/lib/phone'

import { otpAction, type OtpState } from './actions'

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<OtpState, FormData>(otpAction, { step: 'phone' })

  if (state.step === 'code') {
    return (
      <form action={action} className="space-y-5">
        <input type="hidden" name="phone" value={state.phone} />
        {next && <input type="hidden" name="next" value={next} />}
        <p className="text-muted-foreground">Code envoyé au {maskPhone(state.phone)}.</p>
        {state.demoCode && (
          <p className="border-l-2 border-brand-red pl-4 text-sm" role="status">
            Mode démo : votre code est <strong className="font-mono text-base tracking-widest">{state.demoCode}</strong>
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="code">Code à 6 chiffres</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            autoFocus
            className="h-14 text-center font-mono text-2xl tracking-[0.5em]"
          />
        </div>
        {state.error && (
          <p role="alert" className="text-accent">
            {state.error}
          </p>
        )}
        <Button type="submit" name="intent" value="verify" size="lg" className="w-full" disabled={pending}>
          {pending ? 'Vérification…' : 'Se connecter'}
        </Button>
        <button type="submit" name="intent" value="reset" formNoValidate className="w-full text-sm text-muted-foreground underline">
          Changer de numéro
        </button>
      </form>
    )
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="intent" value="request" />
      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone mobile</Label>
        <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required className="h-12" placeholder="06 12 34 56 78" />
      </div>
      {state.error && (
        <p role="alert" className="text-accent">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Envoi…' : 'Recevoir mon code'}
      </Button>
      <p className="text-xs text-muted-foreground">Nouveau ? Votre carte de fidélité est créée automatiquement à la première connexion.</p>
    </form>
  )
}
