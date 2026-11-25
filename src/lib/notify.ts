import type { Payload } from 'payload'

import { sendMail } from '@/lib/mail'
import { siteUrl } from '@/lib/site-url'
import { sendSms } from '@/lib/sms'
import { formatDateFr } from '@/lib/time'
import { reservationToken } from '@/lib/tokens'

type ResLike = {
  ref?: string | null
  name: string
  phone: string
  email?: string | null
  date: string
  startTime: string
  partySize: number
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)

function mailLayout(title: string, body: string): string {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#0a0a0a;color:#fafafa;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:32px 24px">
<p style="letter-spacing:.4em;font-size:12px;color:#a3a3a3;margin:0 0 24px">LE CARRÉ</p>
<h1 style="font-weight:400;font-size:24px;margin:0 0 16px">${escapeHtml(title)}</h1>
${body}
<p style="font-size:12px;color:#a3a3a3;margin-top:32px">Le Carré, Saint-Brice-sous-Forêt</p>
</div></body></html>`
}

export function reservationLinks(ref: string | null | undefined) {
  ref = ref ?? ""
  const t = reservationToken(ref)
  return {
    view: `${siteUrl}/reserver/confirmation/${ref}?t=${t}`,
    cancel: `${siteUrl}/reserver/annuler/${ref}?t=${t}`,
  }
}

function when(r: ResLike) {
  return `${formatDateFr(r.date)} à ${r.startTime.replace(':', 'h')}`
}

export async function notifyReservationConfirmed(payload: Payload, r: ResLike) {
  const links = reservationLinks(r.ref)
  const sms = `Le Carré : votre table pour ${r.partySize} est confirmée ${when(r)}. Réf. ${r.ref}. Annuler : ${links.cancel}`
  await sendSms(payload, { to: r.phone, content: sms, type: 'confirmation' })
  if (r.email) {
    const text = `Bonjour ${r.name},\n\nVotre réservation est confirmée : ${r.partySize} personne(s), ${when(r)}.\nRéférence : ${r.ref}\n\nVoir : ${links.view}\nAnnuler : ${links.cancel}\n\nÀ très vite,\nLe Carré`
    const html = mailLayout(
      'Votre table est réservée',
      `<p>Bonjour ${escapeHtml(r.name)},</p>
<p>Votre réservation est confirmée : <strong>${r.partySize} personne(s)</strong>, ${escapeHtml(when(r))}.</p>
<p>Référence : <strong>${r.ref}</strong></p>
<p><a href="${links.view}" style="display:inline-block;background:#fafafa;color:#0a0a0a;padding:12px 20px;text-decoration:none">Voir ma réservation</a></p>
<p><a href="${links.cancel}" style="color:#a3a3a3">Annuler la réservation</a></p>`,
    )
    await sendMail(payload, { to: r.email, subject: `Réservation confirmée · ${r.ref}`, html, text })
  }
}

export async function notifyReservationCancelled(payload: Payload, r: ResLike) {
  await sendSms(payload, {
    to: r.phone,
    content: `Le Carré : votre réservation ${r.ref} du ${when(r)} est annulée. À bientôt.`,
    type: 'annulation',
  })
  if (r.email) {
    const text = `Bonjour ${r.name},\n\nVotre réservation ${r.ref} du ${when(r)} est annulée.\n\nLe Carré`
    await sendMail(payload, {
      to: r.email,
      subject: `Réservation annulée · ${r.ref}`,
      text,
      html: mailLayout('Réservation annulée', `<p>Bonjour ${escapeHtml(r.name)},</p><p>Votre réservation ${r.ref} du ${escapeHtml(when(r))} est annulée.</p>`),
    })
  }
}

export async function sendReservationReminder(payload: Payload, r: ResLike) {
  const links = reservationLinks(r.ref)
  return sendSms(payload, {
    to: r.phone,
    content: `Le Carré : on vous attend ${when(r)} (${r.partySize} pers.). Un empêchement ? ${links.cancel}`,
    type: 'rappel',
  })
}

export async function notifyManager(payload: Payload, subject: string, lines: string[]) {
  const settings = await payload.findGlobal({ slug: 'settings' })
  const to = settings.email
  if (!to) return
  await sendMail(payload, {
    to,
    subject,
    text: lines.join('\n'),
    html: mailLayout(subject, lines.map((l) => `<p>${escapeHtml(l)}</p>`).join('')),
  })
}

export async function sendOtp(payload: Payload, phone: string, code: string) {
  return sendSms(payload, {
    to: phone,
    content: `Le Carré : votre code de connexion est ${code}. Il expire dans 10 minutes.`,
    type: 'otp',
  })
}
