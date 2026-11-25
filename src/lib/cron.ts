import { safeEqual } from './tokens'

/** Vérifie l'en-tête Authorization: Bearer CRON_SECRET (envoyé automatiquement par Vercel Cron). */
export function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = request.headers.get('authorization') ?? ''
  return safeEqual(header, `Bearer ${secret}`)
}
