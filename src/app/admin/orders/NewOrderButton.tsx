'use client'

import { useState } from 'react'
import { colors } from '@/lib/theme'
import NewOrderModal from './NewOrderModal'
import type { CustomerBasic } from '@/lib/db/customers'
import type { PickupSpot } from '@/lib/db/pickup-spots'

type Meal = { id: string; name: string }
type Size = { id: string; name: string }

export default function NewOrderButton({
  weekStr,
  meals,
  sizes,
  customers,
  pickupSpots,
}: {
  weekStr: string
  meals: Meal[]
  sizes: Size[]
  customers: CustomerBasic[]
  pickupSpots: PickupSpot[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '8px 18px',
          borderRadius: 8,
          border: 'none',
          background: colors.orange,
          color: colors.white,
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        + Nueva orden
      </button>

      {open && (
        <NewOrderModal
          weekStr={weekStr}
          meals={meals}
          sizes={sizes}
          customers={customers}
          pickupSpots={pickupSpots}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
