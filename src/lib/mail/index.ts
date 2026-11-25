import type { Payload } from 'payload'

import { isDemo } from '@/lib/demo'

export interface MailProvider {
  readonly name: string
  send(args: { to: string; subject: string; html: string; text: string }): Promise<void>
}

class ResendMailProvider implements MailProvider {
  readonly name = 'resend'
  constructor(
    private apiKey: string,
    private from: string,
  ) {}

  async send({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: this.from, to: [to], subject, html, text }),
    })
    if (!res.ok) throw new Error(`Resend ${res.status} : ${await res.text()}`)
  }
}

class DemoMailProvider implements MailProvider {
  readonly name = 'demo'
  async send({ to, subject, text }: { to: string; subject: string; text: string }) {
    console.info(`[Mail démo] ${to} : ${subject}\n${text}`)
  }
}

export function getMailProvider(): MailProvider {
  const key = process.env.RESEND_API_KEY
  const from = process.env.MAIL_FROM
  if (isDemo() || !key || !from) return new DemoMailProvider()
  return new ResendMailProvider(key, from)
}

export async function sendMail(
  payload: Payload,
  args: { to: string; subject: string; html: string; text: string },
): Promise<boolean> {
  try {
    await getMailProvider().send(args)
    return true
  } catch (err) {
    payload.logger.error({ err, msg: `Échec mail « ${args.subject} » vers ${args.to}` })
    return false
  }
}
