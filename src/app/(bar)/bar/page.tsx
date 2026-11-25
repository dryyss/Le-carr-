import { redirect } from 'next/navigation'

import { loadBarOrders } from '@/lib/bar'
import { getPayloadClient, getStaffUser } from '@/lib/payload'

import { BarBoard } from './BarBoard'

export const dynamic = 'force-dynamic'

export default async function BarPage() {
  const user = await getStaffUser()
  if (!user) redirect('/admin/login?redirect=%2Fbar')
  const payload = await getPayloadClient()
  const [orders, items, categories] = await Promise.all([
    loadBarOrders(payload),
    payload.find({ collection: 'menu-items', sort: 'order', limit: 1000, depth: 0, pagination: false, select: { title: true, available: true, category: true } }),
    payload.find({ collection: 'menu-categories', sort: 'order', limit: 100, depth: 0, pagination: false, select: { title: true } }),
  ])

  return (
    <BarBoard
      initialOrders={orders}
      since={new Date().toISOString()}
      userName={user.name}
      products={categories.docs.map((c) => ({
        category: c.title,
        items: items.docs
          .filter((i) => (typeof i.category === 'object' ? i.category.id : i.category) === c.id)
          .map((i) => ({ id: i.id, title: i.title, available: i.available !== false })),
      }))}
    />
  )
}
