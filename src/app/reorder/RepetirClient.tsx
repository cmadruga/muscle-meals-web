'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store/cart'
import type { CartItem } from '@/lib/store/cart'
import type { PackageGroup, SkippedSlot, ActiveMealOption } from './page'
import { colors } from '@/lib/theme'
import Link from 'next/link'

interface Props {
  packages: PackageGroup[]
  individuals: CartItem[]
  skippedSlots: SkippedSlot[]
  activeMealOptions: ActiveMealOption[]
  orderDate: string | null
  orderNumber: string | null
}

type Selection = { mealId: string; mealName: string }

export default function RepetirClient({
  packages, individuals, skippedSlots, activeMealOptions, orderDate, orderNumber,
}: Props) {
  const router = useRouter()
  const { addItem, clearCart } = useCartStore()
  const [selected, setSelected] = useState<Selection[]>([])

  const needed = skippedSlots.length
  const remaining = needed - selected.length
  const canProceed = (packages.length > 0 || individuals.length > 0 || needed > 0) && remaining === 0

  const formattedDate = orderDate
    ? new Date(orderDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const hasItems = packages.length > 0 || individuals.length > 0 || needed > 0

  const countOf = (mealId: string) => selected.filter(s => s.mealId === mealId).length

  const toggleMeal = (opt: ActiveMealOption) => {
    const c = countOf(opt.id)
    if (c > 0) {
      // remove one instance
      const idx = selected.findLastIndex(s => s.mealId === opt.id)
      setSelected(prev => prev.filter((_, i) => i !== idx))
    } else if (selected.length < needed) {
      setSelected(prev => [...prev, { mealId: opt.id, mealName: opt.name }])
    }
  }

  const handleRepetir = () => {
    clearCart()
    packages.forEach(pkg => pkg.items.forEach(item => addItem(item)))
    individuals.forEach(item => addItem(item))
    skippedSlots.forEach((slot, idx) => {
      const rep = selected[idx]
      if (!rep) return
      addItem({
        mealId: rep.mealId,
        mealName: rep.mealName,
        sizeId: slot.sizeId,
        sizeName: slot.sizeName,
        qty: slot.qty,
        unitPrice: slot.unitPrice,
        ...(slot.packageInstanceId
          ? { packageInstanceId: slot.packageInstanceId, packageName: 'Arma tu paquete' }
          : {}),
      })
    })
    router.push('/checkout')
  }

  const activeQty =
    packages.reduce((n, p) => n + p.items.reduce((s, i) => s + i.qty, 0), 0) +
    individuals.reduce((n, i) => n + i.qty, 0)
  const replacedQty = skippedSlots.slice(0, selected.length).reduce((n, s) => n + s.qty, 0)
  const totalItems = activeQty + replacedQty

  const activePrice =
    packages.reduce((n, p) => n + p.items.reduce((s, i) => s + i.unitPrice * i.qty, 0), 0) +
    individuals.reduce((n, i) => n + i.unitPrice * i.qty, 0)
  const replacedPrice = skippedSlots.slice(0, selected.length).reduce((n, s) => n + s.unitPrice * s.qty, 0)
  const totalPrice = activePrice + replacedPrice

  return (
    <main style={{
      minHeight: '100vh',
      background: colors.black,
      color: colors.white,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{ maxWidth: 520, width: '100%' }}>

        <h1 className="franchise-stroke" style={{
          fontFamily: 'Franchise, sans-serif',
          fontSize: 42,
          lineHeight: 1,
          letterSpacing: 0,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          <span style={{ color: colors.orange }}>Volver</span> a pedir
        </h1>

        {!hasItems ? (
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <p style={{ color: colors.textMuted, fontSize: 15, marginBottom: 24 }}>
              Aún no tienes pedidos anteriores.
            </p>
            <Link href="/menu" className="franchise-stroke" style={{
              display: 'inline-block', padding: '14px 28px',
              background: colors.orange, color: colors.white, borderRadius: 8,
              textDecoration: 'none', fontFamily: 'Franchise, sans-serif',
              fontSize: 20, letterSpacing: 0, lineHeight: 1, textTransform: 'uppercase',
            }}>
              Ver menú →
            </Link>
          </div>
        ) : (
          <>
            <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 24 }}>
              Repite tu último pedido
            </p>

            {/* Active items */}
            {(packages.length > 0 || individuals.length > 0) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: needed > 0 ? 28 : 0 }}>
                {packages.map((pkg, pi) => (
                  <div key={pkg.instanceId} style={{
                    background: colors.grayDark,
                    border: `1px solid ${colors.orange}44`,
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      padding: '10px 16px',
                      background: colors.orange + '18',
                      borderBottom: `1px solid ${colors.orange}33`,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span style={{ color: colors.orange, fontWeight: 700, fontSize: 13 }}>
                        Arma tu paquete · x{pkg.items.length}{packages.length > 1 ? ` (${pi + 1})` : ''}
                      </span>
                      <span style={{ color: colors.white, fontWeight: 600, fontSize: 13 }}>
                        ${(pkg.items.reduce((s, i) => s + i.unitPrice * i.qty, 0) / 100).toFixed(0)} MXN
                      </span>
                    </div>
                    {pkg.items.map((item, i) => (
                      <div key={`${item.mealId}-${i}`} style={{
                        padding: '11px 16px',
                        borderBottom: i < pkg.items.length - 1 ? `1px solid ${colors.grayLight}` : 'none',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                      }}>
                        <span style={{ fontSize: 14, color: colors.white }}>{item.mealName}</span>
                        <span style={{ fontSize: 12, color: colors.textMuted, flexShrink: 0 }}>{item.sizeName}</span>
                      </div>
                    ))}
                  </div>
                ))}

                {individuals.length > 0 && (
                  <div style={{
                    background: colors.grayDark, border: `1px solid ${colors.grayLight}`,
                    borderRadius: 12, overflow: 'hidden',
                  }}>
                    {packages.length > 0 && (
                      <div style={{
                        padding: '8px 16px', borderBottom: `1px solid ${colors.grayLight}`,
                        color: colors.textMuted, fontSize: 12, fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>Individual</div>
                    )}
                    {individuals.map((item, i) => (
                      <div key={`${item.mealId}-${item.sizeId}-${i}`} style={{
                        padding: '12px 16px',
                        borderBottom: i < individuals.length - 1 ? `1px solid ${colors.grayLight}` : 'none',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                      }}>
                        <div>
                          <span style={{ fontSize: 14, color: colors.white }}>{item.mealName}</span>
                          <span style={{ fontSize: 12, color: colors.textMuted, marginLeft: 8 }}>{item.sizeName}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                          <span style={{ fontSize: 12, color: colors.textMuted }}>×{item.qty}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: colors.white }}>
                            ${(item.unitPrice * item.qty / 100).toFixed(0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Replacement picker */}
            {needed > 0 && (
              <div style={{ marginBottom: 28 }}>
                {/* Header + counter */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                      {needed === 1 ? 'Elige un reemplazo' : `Elige ${needed} reemplazos`}
                    </p>
                    <p style={{ fontSize: 11, color: colors.textMuted, margin: '2px 0 0' }}>
                      {needed === 1
                        ? `${skippedSlots[0].originalMealName} no está disponible esta semana`
                        : `${skippedSlots.map(s => s.originalMealName).join(', ')} no disponibles`}
                    </p>
                  </div>
                  <div style={{
                    padding: '4px 12px',
                    background: remaining === 0 ? colors.orange + '22' : '#f59e0b18',
                    border: `1px solid ${remaining === 0 ? colors.orange + '66' : '#f59e0b44'}`,
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 700,
                    color: remaining === 0 ? colors.orange : '#f59e0b',
                    whiteSpace: 'nowrap',
                  }}>
                    {selected.length} / {needed}
                  </div>
                </div>

                {/* Meal grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 10,
                }}>
                  {activeMealOptions.map(opt => {
                    const count = countOf(opt.id)
                    const isSelected = count > 0
                    const isDisabled = !isSelected && selected.length >= needed
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleMeal(opt)}
                        disabled={isDisabled}
                        style={{
                          position: 'relative',
                          background: isSelected ? colors.orange + '15' : colors.grayDark,
                          border: `2px solid ${isSelected ? colors.orange : colors.grayLight}`,
                          borderRadius: 10,
                          overflow: 'hidden',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          opacity: isDisabled ? 0.4 : 1,
                          padding: 0,
                          textAlign: 'left',
                          transition: 'border-color 0.15s, background 0.15s',
                        }}
                      >
                        {/* Image */}
                        <div style={{
                          width: '100%',
                          aspectRatio: '4/3',
                          background: colors.black,
                          overflow: 'hidden',
                          position: 'relative',
                        }}>
                          {opt.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={opt.imageUrl}
                              alt={opt.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                          ) : (
                            <div style={{
                              width: '100%', height: '100%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 28, color: colors.grayLight,
                            }}>
                              🍽️
                            </div>
                          )}

                          {/* Selected overlay */}
                          {isSelected && (
                            <div style={{
                              position: 'absolute', inset: 0,
                              background: colors.orange + '33',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: '50%',
                                background: colors.orange,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 16, color: colors.white, fontWeight: 700,
                              }}>
                                {count > 1 ? count : '✓'}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Name */}
                        <div style={{
                          padding: '8px 8px',
                          fontSize: 12,
                          fontWeight: isSelected ? 700 : 400,
                          color: isSelected ? colors.white : colors.textMuted,
                          lineHeight: 1.3,
                          textAlign: 'center',
                        }}>
                          {opt.name}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Total */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0', borderTop: `1px solid ${colors.grayLight}`, marginBottom: 20,
            }}>
              <span style={{ color: colors.textMuted, fontSize: 14 }}>{totalItems} comidas</span>
              <span style={{ color: colors.white, fontWeight: 700, fontSize: 18 }}>
                ${(totalPrice / 100).toFixed(0)} MXN
              </span>
            </div>

            <button
              onClick={handleRepetir}
              disabled={!canProceed}
              className={canProceed ? 'franchise-stroke' : undefined}
              style={{
                width: '100%',
                padding: '16px',
                background: canProceed ? colors.orange : colors.grayDark,
                color: canProceed ? colors.white : colors.textMuted,
                border: `1px solid ${canProceed ? 'transparent' : colors.grayLight}`,
                borderRadius: 8,
                fontFamily: 'Franchise, sans-serif',
                fontSize: canProceed ? 22 : 16,
                letterSpacing: 0,
                lineHeight: 1,
                textTransform: 'uppercase',
                cursor: canProceed ? 'pointer' : 'not-allowed',
              }}
            >
              {remaining > 0
                ? `Elige ${remaining} más para continuar`
                : 'Volver a pedir →'}
            </button>
          </>
        )}
      </div>
    </main>
  )
}
