'use server'

import { findTableByQr } from '@/lib/ordering'
import { getPayloadClient } from '@/lib/payload'
import { startPayment } from '@/lib/payment'
import { siteUrl } from '@/lib/site-url'
import { verifyOrderToken } from '@/lib/tokens'

export type TrackAuth = { kind: 'table'; tableCode: string; token: string } | { kind: 'order'; token: string }

export type OrderStatusView = { status: string; paymentStatus: string }

async function loadAuthorizedOrder(id: number, auth: TrackAuth) {
  const payload = await getPayloadClient()
  const order = await payload.findByID({ collection: 'orders', id, depth: 0 }).catch(() => null)
  if (!order) return null
  if (auth.kind === 'order') return verifyOrderToken(id, auth.token) ? { payload, order } : null
  const table = await findTableByQr(payload, auth.tableCode, auth.token)
  const tableId = typeof order.table === 'object' ? order.table?.id : order.table
  return table && tableId === table.id ? { payload, order } : null
}

/** Statut d'une commande pour les pages de suivi (accès par QR de table ou par jeton de commande). */
export async function getTrackedOrderStatus(id: number, auth: TrackAuth): Promise<OrderStatusView | null> {
  const found = await loadAuthorizedOrder(id, auth)
  return found ? { status: found.order.status, paymentStatus: found.order.paymentStatus ?? 'a_regler' } : null
}

/** Relance le paiement en ligne d'une commande non payée. Renvoie l'URL de paiement. */
export async function retryPayment(id: number, auth: TrackAuth, returnPath: string): Promise<string | null> {
  // chemin relatif uniquement : pas de redirection vers un autre site
  if (!returnPath.startsWith('/') || returnPath.startsWith('//')) return null
  const returnUrl = `${siteUrl}${returnPath}`
  const found = await loadAuthorizedOrder(id, auth)
  if (!found || found.order.paymentStatus === 'payee' || found.order.status === 'annulee') return null
  const sep = returnUrl.includes('?') ? '&' : '?'
  return startPayment(found.payload, found.order, { success: `${returnUrl}${sep}paiement=ok`, cancel: `${returnUrl}${sep}paiement=annule` })
}
