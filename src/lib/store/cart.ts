import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  mealId: string
  mealName: string
  sizeId: string
  sizeName: string
  qty: number
  unitPrice: number // en centavos
  packageId?: string // ID del paquete en la DB (para metadata)
  packageName?: string // Nombre del paquete
  packageInstanceId?: string // ID único de esta instancia del paquete en el carrito
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (mealId: string, sizeId: string) => void
  removePackage: (packageInstanceId: string) => void
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
          // Si es un paquete, NUNCA combinar - cada paquete es independiente
          if (newItem.packageInstanceId) {
            return { items: [...state.items, newItem] }
          }

          // Solo combinar items individuales (sin packageInstanceId)
          const existingIndex = state.items.findIndex(
            item => 
              item.mealId === newItem.mealId && 
              item.sizeId === newItem.sizeId &&
              !item.packageInstanceId // Solo items individuales
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
            item => !(item.mealId === mealId && item.sizeId === sizeId && !item.packageInstanceId)
          )
        }))
      },

      removePackage: (packageInstanceId) => {
        set((state) => ({
          items: state.items.filter(
            item => item.packageInstanceId !== packageInstanceId
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
            item.mealId === mealId && item.sizeId === sizeId && !item.packageInstanceId
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
