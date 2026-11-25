export function PrintQrButton() {
  return (
    <div className="lc-toolbar">
      <a className="btn btn--style-primary btn--size-small" href="/api/qr?format=pdf" target="_blank" rel="noopener">
        Imprimer les QR codes (PDF A4)
      </a>
    </div>
  )
}
