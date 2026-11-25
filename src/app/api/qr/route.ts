import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

import { getPayloadClient, getStaffUser } from '@/lib/payload'
import { qrPng, tableUrl } from '@/lib/qr'

export const dynamic = 'force-dynamic'

/**
 * GET /api/qr?table=ID            => PNG du QR d'une table
 * GET /api/qr?format=pdf          => PDF A4, 6 QR par page, toutes les tables actives
 * Réservé au staff.
 */
export async function GET(request: Request) {
  if (!(await getStaffUser())) return new Response('Accès réservé à l’équipe', { status: 401 })
  const url = new URL(request.url)
  const payload = await getPayloadClient()

  const tableId = url.searchParams.get('table')
  if (tableId) {
    const table = await payload.findByID({ collection: 'tables', id: tableId, depth: 0 }).catch(() => null)
    if (!table?.qrToken) return new Response('Table introuvable', { status: 404 })
    const png = await qrPng(tableUrl(table.code, table.qrToken), 600)
    const headers: HeadersInit = { 'content-type': 'image/png', 'cache-control': 'no-store' }
    if (url.searchParams.get('download')) headers['content-disposition'] = `attachment; filename="qr-${table.code}.png"`
    return new Response(new Uint8Array(png), { headers })
  }

  const { docs: tables } = await payload.find({
    collection: 'tables',
    where: { active: { equals: true } },
    sort: 'code',
    limit: 200,
    depth: 0,
    pagination: false,
  })

  const pdf = await PDFDocument.create()
  pdf.setTitle('QR codes des tables · Le Carré')
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  let logo: Awaited<ReturnType<typeof pdf.embedPng>> | null = null
  try {
    const res = await fetch(new URL('/brand/logo.png', url.origin))
    if (res.ok) logo = await pdf.embedPng(new Uint8Array(await res.arrayBuffer()))
  } catch {
    logo = null
  }

  const W = 595.28
  const H = 841.89
  const cols = 2
  const rows = 3
  const cellW = W / cols
  const cellH = H / rows
  const black = rgb(0.04, 0.04, 0.04)
  const grey = rgb(0.45, 0.45, 0.45)

  for (let i = 0; i < tables.length; i++) {
    if (i % (cols * rows) === 0) pdf.addPage([W, H])
    const page = pdf.getPages().at(-1)!
    const slot = i % (cols * rows)
    const x0 = (slot % cols) * cellW
    const y0 = H - (Math.floor(slot / cols) + 1) * cellH
    const t = tables[i]
    const cx = x0 + cellW / 2

    // repères de découpe
    page.drawRectangle({ x: x0 + 12, y: y0 + 12, width: cellW - 24, height: cellH - 24, borderColor: rgb(0.85, 0.85, 0.85), borderWidth: 0.5 })

    if (logo) page.drawImage(logo, { x: cx - 22, y: y0 + cellH - 70, width: 44, height: 44 })
    const qr = await pdf.embedPng(new Uint8Array(await qrPng(tableUrl(t.code, t.qrToken ?? ''), 500)))
    const size = 150
    page.drawImage(qr, { x: cx - size / 2, y: y0 + 72, width: size, height: size })

    const label = t.label
    page.drawText(label, { x: cx - bold.widthOfTextAtSize(label, 16) / 2, y: y0 + 50, size: 16, font: bold, color: black })
    const hint = 'Scannez pour voir la carte et commander'
    page.drawText(hint, { x: cx - font.widthOfTextAtSize(hint, 9) / 2, y: y0 + 34, size: 9, font, color: grey })
    const code = `Table ${t.code}`
    page.drawText(code, { x: cx - font.widthOfTextAtSize(code, 8) / 2, y: y0 + 22, size: 8, font, color: grey })
  }

  if (tables.length === 0) {
    const page = pdf.addPage([W, H])
    page.drawText('Aucune table active.', { x: 60, y: H - 80, size: 14, font })
  }

  const bytes = await pdf.save()
  return new Response(new Uint8Array(bytes), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': 'inline; filename="qr-tables-le-carre.pdf"',
      'cache-control': 'no-store',
    },
  })
}
