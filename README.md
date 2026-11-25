# Le Carré

Plateforme web du Carré, restaurant lounge à Saint-Brice-sous-Forêt (95) : site vitrine, réservation en ligne avec précommande, commande à table par QR code, commande à emporter, paiement en ligne, écran bar en temps réel, fidélité, événements, privatisation et back-office.

Réalisé par Magar Développement.

## Stack

| Brique | Choix |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Back-office | Payload CMS 3, intégré sur `/admin`, en français |
| Base | PostgreSQL (Neon, région Francfort), schéma piloté par migrations |
| Styles | Tailwind CSS 4 + shadcn/ui, tokens dans `src/styles/globals.css` |
| Temps réel | Server-Sent Events (`/api/bar/stream`) |
| SMS / mails / paiement | Brevo, Resend, Stripe Checkout, chacun derrière une interface (`src/lib/sms`, `src/lib/mail`, `src/lib/payment`) |
| Hébergement | Vercel (fonctions en `fra1`) |

## Démarrer en local

```bash
npm install
cp .env.example .env.local          # ou : vercel env pull .env.local
# Base locale : docker compose up -d  (ou la base Neon de dev)
npx payload migrate
npm run seed                         # carte réelle + données de démo
npm run dev                          # http://localhost:3000
```

Comptes de démo (quand `DEMO_MODE=true`) :

| Rôle | E-mail | Mot de passe |
|---|---|---|
| Gérant | gerant@lecarre.example | demo-gerant |
| Serveur / bar | serveur@lecarre.example | demo-serveur |

## Les parcours

| Page | Rôle |
|---|---|
| `/` | Vitrine : ambiance, incontournables, carte, événements, fidélité, avis, accès, FAQ |
| `/carte` | Carte consultable |
| `/reserver` | Réservation (créneaux calculés, tables attribuées), précommande et paiement en ligne facultatifs |
| `/reserver/confirmation/[ref]`, `/reserver/annuler/[ref]` | Liens envoyés par SMS et mail (jeton signé) |
| `/commander` | Commande à emporter avec créneau de retrait (sans alcool) |
| `/t/[code]?k=[jeton]` | Commande à table depuis le QR code |
| `/commande/[id]?t=[jeton]` | Suivi d'une précommande ou d'une commande à emporter |
| `/connexion`, `/compte` | Fidélité : connexion par code SMS, points, récompenses, profil, suppression de compte |
| `/evenements`, `/privatisation` | Agenda et demande de privatisation |
| `/bar` | Écran bar plein écran (staff), commandes en direct, son, ruptures |
| `/admin` | Back-office : tableau de bord, réservations, tables et QR (PDF A4), carte, clients, journal SMS |

## Règles métier clés

- **Loi Evin** : aucun produit du tabac dans la carte ni la commande. Un hook refuse tout titre contenant chicha, narguilé, tabac… Les pages chicha du PDF client n'ont pas été reprises. L'alcool n'est pas proposé à emporter.
- **Prix, points, disponibilités** : toujours recalculés côté serveur (`src/lib/pricing.ts`, `src/lib/availability.ts`, `src/lib/loyalty.ts`).
- **Pas de double réservation** : vérification refaite dans une transaction, sous verrou Postgres (`src/lib/db-lock.ts`).
- **Points** : uniquement via `LoyaltyTransactions` (hook), crédités quand une commande liée à un client passe à « servie ».
- **Précommande** : enregistrée « programmée », lancée au bar quand la réservation passe à « arrivée » (ou bouton « Lancer » sur l'écran bar).
- **RGPD** : cases de consentement décochées par défaut, SMS marketing seulement avec opt-in et mention STOP, suppression de compte depuis `/compte`.

## Mise en production réelle

1. Variables Vercel : `DEMO_MODE=false`, `BREVO_API_KEY`, `RESEND_API_KEY`, `MAIL_FROM`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `BLOB_READ_WRITE_TOKEN` (créer un store Blob).
2. Stripe : déclarer le webhook `https://<domaine>/api/paiement/webhook` (événement `checkout.session.completed`).
3. Rappels SMS toutes les 15 min : le plan Hobby de Vercel n'autorise qu'un cron par jour. Le workflow `.github/workflows/rappels.yml` s'en charge : créer les secrets du dépôt `SITE_URL` et `CRON_SECRET`.
4. Remplacer les valeurs marquées `[À REMPLACER]` (adresse, téléphone, mentions légales, textes, avis) et ajouter les photos (ambiance uniquement) dans l'admin.
5. Vider les données de démo : `npx payload migrate:fresh` puis `npm run seed` avec `DEMO_MODE=false` (recrée comptes, carte et paramètres ; les mots de passe générés s'affichent une fois).
6. Imprimer les QR : Admin, Tables, « Imprimer les QR codes ».

## Base de données et migrations

Le schéma ne change que par migrations (`push: false`). Après une modification de collection :

```bash
npm run generate:types
npx payload migrate:create nom_du_changement
npx payload migrate
```

Le build Vercel (`npm run ci`) applique les migrations avant `next build`.

## Tests

```bash
npm test             # 34 tests unitaires : créneaux, prix, fidélité, jetons, horaires, Stripe, loi Evin
npm run build && npm run test:e2e   # 14 parcours Playwright sur mobile 375 px (base seedée en mode démo)
```

Les parcours e2e couvrent : vitrine sans débordement, carte sans tabac, réservation et annulation, réservation avec précommande payée, renvoi vers la privatisation, commande à emporter payée, QR invalide, commande à table reçue sur l'écran bar, connexion par code, tableau de bord et PDF des QR, refus des routes protégées.

## Crons

| Route | Fréquence | Rôle |
|---|---|---|
| `/api/cron/rappels` | toutes les 15 min (GitHub Actions) | SMS de rappel 3 h avant, idempotent |
| `/api/cron/quotidien` | 1 fois par jour (Vercel Cron) | bonus anniversaire, expiration des points, purge des codes |

Les deux exigent `Authorization: Bearer $CRON_SECRET`.
