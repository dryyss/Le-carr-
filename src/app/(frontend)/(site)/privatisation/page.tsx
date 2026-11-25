import type { Metadata } from 'next'

import { PrivatizationForm } from './PrivatizationForm'

export const metadata: Metadata = {
  title: 'Privatiser le Carré',
  description: 'Anniversaire, soirée d’entreprise, grand groupe : demandez la privatisation du Carré à Saint-Brice-sous-Forêt.',
}

export default function PrivatisationPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-14 px-5 py-14 lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-6">
        <p className="kicker">Groupes et événements privés</p>
        <h1 className="text-5xl sm:text-6xl">Privatiser le Carré</h1>
        <p className="text-lg text-muted-foreground">
          Anniversaire, enterrement de vie, afterwork ou soirée d’entreprise : on vous réserve tout ou partie du lieu, avec une formule sur
          mesure.
        </p>
        <ul className="space-y-3 border-t border-border pt-6 text-muted-foreground">
          <li>Salle, terrasse ou espace VIP</li>
          <li>Formules boissons et snacks pour le groupe</li>
          <li>Musique et ambiance adaptées</li>
          <li>Réponse sous 48 h</li>
        </ul>
      </div>
      <PrivatizationForm />
    </div>
  )
}
