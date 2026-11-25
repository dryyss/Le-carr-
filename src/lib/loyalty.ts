/** Points gagnés pour un montant (centimes), arrondis à l'inférieur. */
export function pointsForAmount(totalCents: number, pointsPerEuro: number): number {
  if (totalCents <= 0 || pointsPerEuro <= 0) return 0
  return Math.floor((totalCents / 100) * pointsPerEuro)
}

/** Nouveau solde après une transaction ; refuse un solde négatif. */
export function applyPoints(balance: number, delta: number): number {
  const next = balance + delta
  if (next < 0) throw new Error(`Solde insuffisant : ${balance} point(s) disponible(s).`)
  return next
}
