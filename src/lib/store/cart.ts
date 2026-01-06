import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  mealId: string
  mealName: string
  sizeId: string
  sizeName: string
  qty: number
  unitPrice: number // en centavos
  packageId?: string // si viene de un paquete
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (mealId: string, sizeId: string) => void
  updateQty: (mealId: string, sizeId: string, qty: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        set((state) => {
          // Verificar si ya existe (mismo meal + size)
          const existingIndex = state.items.findIndex(
            item => item.mealId === newItem.mealId && item.sizeId === newItem.sizeId
          )

          if (existingIndex >= 0) {
            // Actualizar cantidad
            const updated = [...state.items]
            updated[existingIndex].qty += newItem.qty
            return { items: updated }
          }

          // Agregar nuevo
          return { items: [...state.items, newItem] }
        })
      },

      removeItem: (mealId, sizeId) => {
        set((state) => ({
          items: state.items.filter(
            item => !(item.mealId === mealId && item.sizeId === sizeId)
          )
        }))
      },

      updateQty: (mealId, sizeId, qty) => {
        if (qty <= 0) {
          get().removeItem(mealId, sizeId)
          return
        }

        set((state) => ({
          items: state.items.map(item =>
            item.mealId === mealId && item.sizeId === sizeId
              ? { ...item, qty }
              : item
          )
        }))
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0)
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.qty, 0)
      }
    }),
    {
      name: 'muscle-meals-cart', // nombre en localStorage
    }
  )
)
