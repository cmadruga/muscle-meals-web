'use client'

import { useState } from 'react'
import type { ShoppingItem, EmpaquesMeal } from '@/lib/utils/production'
import ShoppingList from '@/app/admin/orders/ShoppingList'
import EmpaqueCarousel from './EmpaqueCarousel'
import { colors } from '@/lib/theme'

type Tab = 'lista' | 'empaques'

export default function PrepTabs({
  shoppingItems,
  weekKey,
  empaquesMeals,
}: {
  shoppingItems: ShoppingItem[]
  weekKey: string
  empaquesMeals: EmpaquesMeal[]
}) {
  const [tab, setTab] = useState<Tab>('lista')

  const tabBtn = (t: Tab, label: string) => (
    <button
      onClick={() => setTab(t)}
      style={{
        background: tab === t ? colors.orange : 'transparent',
        border: `1px solid ${tab === t ? colors.orange : colors.grayLight}`,
        borderRadius: 8,
        color: tab === t ? colors.white : colors.textMuted,
        padding: '7px 18px',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        letterSpacing: '0.03em',
      }}
    >
      {label}
    </button>
  )

  return (
    <div>
      {/* Tab selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {tabBtn('lista', 'Lista de Compras')}
        {tabBtn('empaques', 'Empaques')}
      </div>

      {tab === 'lista' && <ShoppingList items={shoppingItems} weekKey={weekKey} />}
      {tab === 'empaques' && <EmpaqueCarousel meals={empaquesMeals} />}
    </div>
  )
}
