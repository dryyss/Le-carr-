import type { Payload } from 'payload'

import { isDemo } from '@/lib/demo'

export type SmsCategory = 'transactional' | 'marketing'
export type SmsType = 'confirmation' | 'rappel' | 'annulation' | 'otp' | 'anniversaire' | 'offre'

export interface SmsProvider {
  readonly name: string
  send(args: { to: string; content: string; category: SmsCategory }): Promise<{ id?: string }>
}

/** Brevo, API SMS transactionnelle. */
class BrevoSmsProvider implements SmsProvider {
  readonly name = 'brevo'
  constructor(
    private apiKey: string,
    private sender: string,
  ) {}

  async send({ to, content, category }: { to: string; content: string; category: SmsCategory }) {
    const res = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
      method: 'POST',
      headers: { 'api-key': this.apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: this.sender,
        recipient: to.replace('+', ''),
        content,
        type: category === 'marketing' ? 'marketing' : 'transactional',
      }),
    })
    if (!res.ok) throw new Error(`Brevo ${res.status} : ${await res.text()}`)
    const json = (await res.json()) as { messageId?: number | string }
    return { id: json.messageId ? String(json.messageId) : undefined }
  }
}

/** Démo / dev : n'envoie rien, se contente de journaliser. */
class DemoSmsProvider implements SmsProvider {
  readonly name = 'demo'
  async send({ to, content }: { to: string; content: string }) {
    console.info(`[SMS démo] ${to} : ${content}`)
    return {}
  }
}

export function getSmsProvider(): SmsProvider {
  const key = process.env.BREVO_API_KEY
  if (isDemo() || !key) return new DemoSmsProvider()
  return new BrevoSmsProvider(key, process.env.SMS_SENDER || 'LECARRE')
}

/**
 * Envoie un SMS et le journalise (suivi de la consommation facturée).
 * Les SMS marketing doivent être filtrés par l'appelant sur optInSms.
 */
export async function sendSms(
  payload: Payload,
  args: { to: string; content: string; type: SmsType; category?: SmsCategory },
): Promise<boolean> {
  const category = args.category ?? (args.type === 'anniversaire' || args.type === 'offre' ? 'marketing' : 'transactional')
  const content = category === 'marketing' ? `${args.content} STOP : répondez STOP.` : args.content
  const provider = getSmsProvider()
  try {
    const { id } = await provider.send({ to: args.to, content, category })
    await payload.create({
      collection: 'sms-logs',
      data: {
        to: args.to,
        type: args.type,
        category,
        content,
        status: provider.name === 'demo' ? 'demo' : 'envoye',
        providerId: id,
        segments: Math.max(1, Math.ceil(content.length / 160)),
      },
    })
    return true
  } catch (err) {
    payload.logger.error({ err, msg: `Échec SMS ${args.type} vers ${args.to}` })
    await payload
      .create({
        collection: 'sms-logs',
        data: { to: args.to, type: args.type, category, content, status: 'echec', error: String(err).slice(0, 500) },
      })
      .catch(() => undefined)
    return false
  }
}
