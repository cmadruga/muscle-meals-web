'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { PackageBasic, DishBasic } from '@/lib/types'
import { createOrder, buildOrderPayload } from '@/lib/db/orders'

interface PackageClientProps {
  /** Datos del paquete (pre-cargados desde Server Component) */
  pkg: PackageBasic
  /** Lista de platillos disponibles (pre-cargados desde Server Component) */
  dishes: DishBasic[]
}

/**
 * Client Component para la selección de platillos
 * 
 * RESPONSABILIDADES:
 * - Manejar estado de selección (UI state)
 * - Validar que no se excedan los platillos permitidos
 * - Enviar orden a Supabase
 * - Redirigir a checkout
 * 
 * NO HACE:
 * - Fetch de datos (los recibe como props del Server Component)
 * - Lógica de negocio compleja (delegada a lib/db)
 */
export default function PackageClient({ pkg, dishes }: PackageClientProps) {
  const router = useRouter()
  const [selection, setSelection] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cálculos derivados del estado
  const totalSelected = useMemo(
    () => Object.values(selection).reduce((sum, qty) => sum + qty, 0),
    [selection]
  )

  const canSubmit = totalSelected === pkg.meals_included && !isSubmitting

  // Mapa de nombres para construir la orden
  const dishNames = useMemo(
    () => Object.fromEntries(dishes.map(d => [d.id, d.name])),
    [dishes]
  )

  // Handlers
  const handleIncrement = (dishId: string) => {
    if (totalSelected >= pkg.meals_included) return
    setSelection(prev => ({
      ...prev,
      [dishId]: (prev[dishId] || 0) + 1
    }))
  }

  const handleDecrement = (dishId: string) => {
    setSelection(prev => ({
      ...prev,
      [dishId]: Math.max((prev[dishId] || 0) - 1, 0)
    }))
  }

  const handleSubmit = async () => {
    if (!canSubmit) return

    setIsSubmitting(true)
    setError(null)

    try {
      const payload = buildOrderPayload(pkg.id, pkg.price, selection, dishNames)
      const order = await createOrder(payload)
      router.push(`/checkout/${order.id}`)
    } catch (err) {
      console.error('Error creating order:', err)
      setError('Hubo un error al crear tu orden. Intenta de nuevo.')
      setIsSubmitting(false)
    }
  }

  return (
    <main className="package-selection" style={{ padding: 40 }}>
      <h1>{pkg.name}</h1>
      <p>Selecciona {pkg.meals_included} platillos</p>

      {error && (
        <div style={{ color: 'red', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {dishes.map(dish => (
          <li 
            key={dish.id} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12,
              marginBottom: 8 
            }}
          >
            <span style={{ minWidth: 200 }}>{dish.name}</span>
            
            <button
              onClick={() => handleDecrement(dish.id)}
              disabled={!selection[dish.id]}
              style={{ width: 32, height: 32 }}
            >
              −
            </button>
            
            <span style={{ minWidth: 24, textAlign: 'center' }}>
              {selection[dish.id] || 0}
            </span>
            
            <button
              onClick={() => handleIncrement(dish.id)}
              disabled={totalSelected >= pkg.meals_included}
              style={{ width: 32, height: 32 }}
            >
              +
            </button>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 24 }}>
        <p>
          <strong>Total: {totalSelected} / {pkg.meals_included}</strong>
        </p>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            marginTop: 16,
            padding: '12px 24px',
            fontSize: 16,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            opacity: canSubmit ? 1 : 0.5
          }}
        >
          {isSubmitting ? 'Creando orden...' : 'Continuar al pago'}
        </button>
      </div>
    </main>
  )
}
