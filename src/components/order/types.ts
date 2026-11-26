export type ItemView = {
  id: number
  title: string
  description: string | null
  price: number
  image: string
  tags: string[]
  options: { name: string; supplement: number }[]
}

export type MenuSectionView = {
  id: number
  slug: string
  title: string
  note: string | null
  cover: string
  items: ItemView[]
}

export type CartLine = { key: string; itemId: number; title: string; options: string[]; unitPrice: number; qty: number }

export const MAX_CART_ITEMS = 30
