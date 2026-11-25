/**
 * Mode démo : aucun SMS ni mail réellement envoyé (tout est journalisé),
 * le code de connexion s'affiche à l'écran et les comptes de démo sont indiqués sur /admin.
 * Activé par DEMO_MODE=true. Passer à false avant la mise en service réelle.
 */
export const isDemo = () => process.env.DEMO_MODE === 'true'

export const DEMO_ACCOUNTS = [
  { label: 'Gérant', email: 'gerant@lecarre.example', password: 'demo-gerant' },
  { label: 'Serveur / bar', email: 'serveur@lecarre.example', password: 'demo-serveur' },
] as const
