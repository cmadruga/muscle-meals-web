'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Dish = {
  id: string
  name: string
}

type Package = {
  id: string
  name: string
  meals_included: number
}

export default function PackageClient({
  packageId
}: {
  packageId: string
}) {
  const [pkg, setPkg] = useState<Package | null>(null)
  const [dishes, setDishes] = useState<Dish[]>([])
  const [selection, setSelection] = useState<Record<string, number>>({})

  useEffect(() => {
    const fetchData = async () => {
      const { data: packageData } = await supabase
        .from('products')
        .select('id, name, meals_included')
        .eq('id', packageId)
        .single()

      const { data: dishesData } = await supabase
        .from('dishes')
        .select('id, name')
        .eq('active', true)

      setPkg(packageData)
      setDishes(dishesData || [])
    }

    fetchData()
  }, [packageId])

  if (!pkg) return <p>Cargando paquete...</p>

  const totalSelected = Object.values(selection).reduce(
    (sum, qty) => sum + qty,
    0
  )

  return (
    <main style={{ padding: 40 }}>
      <h1>{pkg.name}</h1>
      <p>Selecciona {pkg.meals_included} platillos</p>

      <ul>
        {dishes.map(dish => (
          <li key={dish.id}>
            {dish.name}

            <button
              onClick={() => {
                if (totalSelected >= pkg.meals_included) return
                setSelection(prev => ({
                  ...prev,
                  [dish.id]: (prev[dish.id] || 0) + 1
                }))
              }}
            >
              +
            </button>

            <button
              onClick={() =>
                setSelection(prev => ({
                  ...prev,
                  [dish.id]: Math.max((prev[dish.id] || 0) - 1, 0)
                }))
              }
            >
              -
            </button>

            <span>{selection[dish.id] || 0}</span>
          </li>
        ))}
      </ul>

      <p>
        Total: {totalSelected} / {pkg.meals_included}
      </p>

      <button disabled={totalSelected !== pkg.meals_included}>
        Continuar
      </button>
    </main>
  )
}