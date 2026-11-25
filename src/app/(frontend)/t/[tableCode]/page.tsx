import { getCurrentCustomer } from '@/lib/customer-session'
import { toSectionViews } from '@/lib/menu-view'
import { findTableByQr, orderingClosedReason } from '@/lib/ordering'
import { getPayloadClient, getSettings } from '@/lib/payload'
import { onlinePaymentAvailable } from '@/lib/payment'
import { getMenu } from '@/lib/queries'

import { TableMenu } from './TableMenu'

export const dynamic = 'force-dynamic'

export default async function TablePage({
  params,
  searchParams,
}: {
  params: Promise<{ tableCode: string }>
  searchParams: Promise<{ k?: string }>
}) {
  const { tableCode } = await params
  const { k } = await searchParams
  const payload = await getPayloadClient()
  const table = await findTableByQr(payload, decodeURIComponent(tableCode), k)

  if (!table) {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="mb-4 text-4xl">QR code non reconnu</h1>
        <p className="text-muted-foreground">
          Ce QR code n’est plus valide ou la table est fermée. Demandez à l’équipe, elle vous apporte la carte.
        </p>
      </div>
    )
  }

  const [settings, menu, customer] = await Promise.all([getSettings(), getMenu(), getCurrentCustomer()])

  return (
    <TableMenu
      table={{ code: table.code, label: table.label, token: k! }}
      sections={toSectionViews(menu)}
      closedReason={orderingClosedReason(settings)}
      customerName={customer ? customer.firstName || 'vous' : null}
      onlinePayment={onlinePaymentAvailable()}
    />
  )
}
