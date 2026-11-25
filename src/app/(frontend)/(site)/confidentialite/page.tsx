import type { Metadata } from 'next'
import Link from 'next/link'

import { LegalPage } from '@/components/site/LegalPage'
import { getSettings } from '@/lib/payload'

export const metadata: Metadata = { title: 'Politique de confidentialité' }
export const revalidate = 3600

export default async function ConfidentialitePage() {
  const s = await getSettings()
  return (
    <LegalPage title="Politique de confidentialité" updated="novembre 2026">
      <p>
        {s.name} est responsable du traitement des données collectées sur ce site. Cette page explique quelles données nous utilisons, pour
        quoi faire et comment exercer vos droits (RGPD).
      </p>

      <h2>Données collectées</h2>
      <ul>
        <li>Réservation : nom, téléphone, e-mail (facultatif), date, nombre de personnes, précisions.</li>
        <li>Commande à table : produits commandés, table, numéro de téléphone si vous souhaitez cumuler des points.</li>
        <li>Fidélité : téléphone, prénom, nom, e-mail, jour et mois d’anniversaire, points et historique.</li>
        <li>Privatisation : coordonnées et détails de votre demande.</li>
      </ul>

      <h2>Pourquoi</h2>
      <ul>
        <li>Gérer votre réservation et vous envoyer confirmation, rappel et annulation (exécution du service demandé).</li>
        <li>Préparer et suivre vos commandes à table.</li>
        <li>Gérer votre programme de fidélité.</li>
        <li>
          Vous envoyer nos offres et soirées par SMS ou e-mail, uniquement si vous l’avez accepté (consentement). Les cases ne sont jamais
          cochées par défaut.
        </li>
      </ul>

      <h2>Messages</h2>
      <p>
        Les SMS de service (confirmation, rappel, annulation, code de connexion) sont envoyés à chaque réservation ou connexion. Les messages
        d’offres ne sont envoyés qu’avec votre accord, et chaque SMS d’offre permet de se désinscrire en répondant STOP. Vous pouvez aussi
        retirer votre accord à tout moment depuis <Link href="/compte">votre compte</Link>.
      </p>

      <h2>Durée de conservation</h2>
      <ul>
        <li>Réservations et commandes : 3 ans, puis anonymisation.</li>
        <li>Compte fidélité : jusqu’à sa suppression, ou 3 ans sans activité.</li>
        <li>Codes de connexion : 10 minutes.</li>
      </ul>

      <h2>Destinataires</h2>
      <p>
        Les données sont réservées à l’équipe du {s.name}. Nos prestataires techniques les traitent pour notre compte : Vercel (hébergement),
        Neon (base de données, Union européenne), Brevo (envoi des SMS), Resend (envoi des e-mails). Aucune donnée n’est vendue.
      </p>

      <h2>Cookies</h2>
      <p>
        Le site n’utilise qu’un cookie technique pour garder votre session fidélité ouverte. Aucun cookie publicitaire ni de mesure
        d’audience tiers.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous pouvez accéder à vos données, les corriger, les supprimer ou vous opposer à leur utilisation. La suppression de votre compte se
        fait directement depuis <Link href="/compte">votre espace fidélité</Link>. Pour toute autre demande : {s.email || '[À REMPLACER : e-mail]'}.
        Vous pouvez aussi saisir la CNIL (cnil.fr).
      </p>
    </LegalPage>
  )
}
