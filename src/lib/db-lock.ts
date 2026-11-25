import { sql } from '@payloadcms/db-postgres'
import { commitTransaction, createLocalReq, initTransaction, killTransaction, type Payload, type PayloadRequest } from 'payload'

type Sessions = Record<string | number, { db: { execute: (q: ReturnType<typeof sql>) => Promise<unknown> } }>

/**
 * Exécute `fn` dans une transaction Payload, après avoir pris un verrou Postgres
 * (pg_advisory_xact_lock) sur `key`. Deux appels concurrents avec la même clé sont sérialisés :
 * la vérification de disponibilité et l'écriture se font sans course possible.
 * Le verrou est relâché automatiquement à la fin de la transaction.
 */
export async function withLock<T>(payload: Payload, key: string, fn: (req: PayloadRequest) => Promise<T>): Promise<T> {
  const req = await createLocalReq({}, payload)
  await initTransaction(req)
  try {
    const id = await req.transactionID
    const session = id != null ? (payload.db as unknown as { sessions: Sessions }).sessions[id] : undefined
    if (session) await session.db.execute(sql`select pg_advisory_xact_lock(hashtext(${key}))`)
    const result = await fn(req)
    await commitTransaction(req)
    return result
  } catch (err) {
    await killTransaction(req)
    throw err
  }
}
