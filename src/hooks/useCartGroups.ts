import { useMemo } from 'react'
import { useCartStore } from '@/lib/store/cart'
import type { CartItem } from '@/lib/store/cart'

export interface PackageGroup {
  packageInstanceId: string
  packageName: string
  sizeName: string
  items: CartItem[]
  totalPrice: number
  totalMeals: number
}

/**
 * Hook para agrupar y calcular datos del carrito
 * Separa la lógica de negocio de la presentación
 */
export function useCartGroups() {
  const items = useCartStore(state => state.items)
  
  // Agrupar paquetes
  const packageGroups = useMemo<PackageGroup[]>(() => {
    const grouped: Record<string, CartItem[]> = {}
    
    items.forEach(item => {
      if (item.packageInstanceId) {
        if (!grouped[item.packageInstanceId]) {
          grouped[item.packageInstanceId] = []
        }
        grouped[item.packageInstanceId].push(item)
      }
    })
    
    return Object.entries(grouped).map(([packageInstanceId, packageItems]) => ({
      packageInstanceId,
      packageName: packageItems[0]?.packageName || 'Paquete',
      sizeName: packageItems[0]?.sizeName || '',
      items: packageItems,
      totalPrice: packageItems.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0),
      totalMeals: packageItems.reduce((sum, item) => sum + item.qty, 0)
    }))
  }, [items])
  
  // Items individuales
  const individualItems = useMemo(() => 
    items.filter(item => !item.packageInstanceId),
    [items]
  )
  
  return {
    packageGroups,
    individualItems,
    isEmpty: items.length === 0
  }
}
