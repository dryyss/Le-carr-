'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import { useState } from 'react'

export function TableQrField() {
  const { id } = useDocumentInfo()
  const [version, setVersion] = useState(0)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (!id) return <p className="lc-muted">Le QR code apparaîtra après le premier enregistrement.</p>

  async function regenerate() {
    if (!confirm('Régénérer le QR ? Les QR déjà imprimés pour cette table ne fonctionneront plus.')) return
    setBusy(true)
    setMessage(null)
    const res = await fetch(`/api/tables/${id}/regenerate-qr`, { method: 'POST', credentials: 'include' })
    setBusy(false)
    if (res.ok) {
      setVersion((v) => v + 1)
      setMessage('Nouveau QR généré. Rechargez la page pour voir le nouveau jeton.')
    } else {
      setMessage('Échec de la régénération.')
    }
  }

  return (
    <div className="lc-qr-field">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/api/qr?table=${id}&v=${version}`} alt="QR code de la table" width={160} height={160} />
      <div>
        <button type="button" className="btn btn--style-secondary btn--size-small" onClick={regenerate} disabled={busy}>
          {busy ? 'Régénération…' : 'Régénérer le QR'}
        </button>
        <a className="btn btn--style-secondary btn--size-small" href={`/api/qr?table=${id}&format=png&download=1`}>
          Télécharger (PNG)
        </a>
        {message && <p className="lc-muted">{message}</p>}
      </div>
    </div>
  )
}
