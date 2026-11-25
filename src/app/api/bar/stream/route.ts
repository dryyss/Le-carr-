import { toBarOrder } from '@/lib/bar'
import { getPayloadClient, getStaffUser } from '@/lib/payload'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const POLL_MS = 2000
const LIFETIME_MS = 55_000

/**
 * Flux SSE des commandes pour l'écran bar. Pousse les commandes modifiées depuis le dernier envoi.
 * La connexion se ferme avant la limite d'exécution Vercel ; EventSource se reconnecte seul
 * et renvoie Last-Event-ID (date de dernière modification vue), donc rien n'est perdu.
 */
export async function GET(request: Request) {
  if (!(await getStaffUser())) return new Response('Accès réservé à l’équipe', { status: 401 })
  const payload = await getPayloadClient()
  const url = new URL(request.url)
  let cursor = request.headers.get('last-event-id') || url.searchParams.get('since') || new Date().toISOString()
  if (Number.isNaN(Date.parse(cursor))) cursor = new Date().toISOString()

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const started = Date.now()
      let closed = false
      request.signal.addEventListener('abort', () => {
        closed = true
      })
      controller.enqueue(encoder.encode('retry: 1000\n\n'))

      while (!closed && Date.now() - started < LIFETIME_MS) {
        try {
          const { docs } = await payload.find({
            collection: 'orders',
            where: { updatedAt: { greater_than: cursor } },
            sort: 'updatedAt',
            limit: 100,
            depth: 1,
            pagination: false,
          })
          if (docs.length) {
            cursor = docs[docs.length - 1].updatedAt
            const data = JSON.stringify(docs.map(toBarOrder))
            controller.enqueue(encoder.encode(`id: ${cursor}\nevent: orders\ndata: ${data}\n\n`))
          } else {
            controller.enqueue(encoder.encode(': ping\n\n'))
          }
        } catch (err) {
          payload.logger.error({ err, msg: 'Flux bar' })
        }
        await new Promise((r) => setTimeout(r, POLL_MS))
      }
      if (!closed) controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    },
  })
}
