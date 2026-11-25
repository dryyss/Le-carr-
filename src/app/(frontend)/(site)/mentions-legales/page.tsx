import type { Metadata } from 'next'

import { LegalPage } from '@/components/site/LegalPage'
import { getSettings } from '@/lib/payload'
import { formatPhoneFr } from '@/lib/phone'
import { addressLine } from '@/lib/site'

export const metadata: Metadata = { title: 'Mentions légales' }
export const revalidate = 3600

export default async function MentionsLegalesPage() {
  const s = await getSettings()
  return (
    <LegalPage title="Mentions légales" updated="novembre 2026">
      <h2>Éditeur du site</h2>
      <p>
        {s.name}, [À REMPLACER : forme juridique et capital], {addressLine(s)}.
        <br />
        SIRET : [À REMPLACER]. TVA intracommunautaire : [À REMPLACER].
        <br />
        Téléphone : {s.phone ? formatPhoneFr(s.phone) : '[À REMPLACER]'}. E-mail : {s.email || '[À REMPLACER]'}.
        <br />
        Directeur de la publication : [À REMPLACER].
      </p>
      <h2>Licences</h2>
      <p>Licence de débit de boissons : [À REMPLACER : type et numéro].</p>
      <h2>Conception et développement</h2>
      <p>Magar Développement.</p>
      <h2>Hébergement</h2>
      <p>
        Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (vercel.com). Base de données hébergée par Neon (région
        Francfort, Union européenne).
      </p>
      <h2>Propriété intellectuelle</h2>
      <p>Le logo, les textes et les photos du site appartiennent à {s.name}. Toute reproduction sans autorisation est interdite.</p>
      <h2>Santé</h2>
      <p>
        L’abus d’alcool est dangereux pour la santé, à consommer avec modération. La vente d’alcool est interdite aux mineurs. Conformément
        à la loi Evin, aucun produit du tabac n’est vendu ni promu sur ce site.
      </p>
    </LegalPage>
  )
}
