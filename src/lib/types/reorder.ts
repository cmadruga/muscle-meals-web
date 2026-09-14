import type { CartItem } from '@/lib/store/cart'

export type ReorderCookie = {
  items: CartItem[]
  unavailable: { name: string; sizeName: string; qty: number }[]
}
