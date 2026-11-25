/**
 * Normalise un numéro au format E.164. Les numéros français saisis « 06 12 34 56 78 »
 * deviennent « +33612345678 ». Retourne null si le numéro n'est pas exploitable.
 */
export function toE164(input: string): string | null {
  const raw = input.replace(/[\s.\-()]/g, '')
  let n = raw
  if (n.startsWith('00')) n = `+${n.slice(2)}`
  if (/^0[1-9]\d{8}$/.test(n)) n = `+33${n.slice(1)}`
  if (/^\+33 ?0/.test(n)) n = n.replace(/^\+330/, '+33')
  return /^\+[1-9]\d{7,14}$/.test(n) ? n : null
}

/** « +33612345678 » => « 06 12 34 56 78 » (numéros français), sinon inchangé. */
export function formatPhoneFr(e164: string): string {
  const m = /^\+33(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(e164)
  return m ? `0${m[1]} ${m[2]} ${m[3]} ${m[4]} ${m[5]}` : e164
}

export function maskPhone(e164: string): string {
  return e164.replace(/(\+\d{4})\d+(\d{2})$/, '$1 •• •• •$2')
}
