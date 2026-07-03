'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store/cart'
import type { CartItem } from '@/lib/store/cart'
import type { PackageGroup, SkippedSlot, ActiveMealOption } from './page'
import { colors } from '@/lib/theme'
import Link from 'next/link'
import { MembershipConfirmModal, type PrefillInfo, type MembershipInfo } from '@/components/MembershipConfirmModal'
import type { PickupSpot } from '@/lib/db/pickup-spots'

interface Props {
  packages: PackageGroup[]
  individuals: CartItem[]
  skippedSlots: SkippedSlot[]
  activeMealOptions: ActiveMealOption[]
  orderDate: string | null
  orderNumber: string | null
  prefill: PrefillInfo
  membership: MembershipInfo
  pickupSpots: PickupSpot[]
  usedMembershipThisWeek: boolean
}

type Selection = { mealId: string; mealName: string }

export default function RepetirClient({
  packages, individuals, skippedSlots, activeMealOptions, orderDate, orderNumber,
  prefill, membership, pickupSpots, usedMembershipThisWeek,
}: Props) {
  const router = useRouter()
  const { addItem, clearCart } = useCartStore()
  const [selected, setSelected] = useState<Selection[]>([])
  const [membershipModalOpen, setMembershipModalOpen] = useState(false)
  const [membershipItems, setMembershipItems] = useState<CartItem[]>([])

  const needed = skippedSlots.length
  const remaining = needed - selected.length
  const hasItems = packages.length > 0 || individuals.length > 0 || needed > 0
  const canProceed = hasItems && remaining === 0

  const countOf = (mealId: string) => selected.filter(s => s.mealId === mealId).length

  const addMeal = (opt: ActiveMealOption) => {
    if (selected.length < needed) setSelected(prev => [...prev, { mealId: opt.id, mealName: opt.name }])
  }

  const removeMeal = (mealId: string) => {
    const idx = selected.findLastIndex(s => s.mealId === mealId)
    if (idx >= 0) setSelected(prev => prev.filter((_, i) => i !== idx))
  }

  // Qty and price totals
  const activeQty = packages.reduce((n, p) => n + p.items.reduce((s, i) => s + i.qty, 0), 0) +
    individuals.reduce((n, i) => n + i.qty, 0)
  const totalQtySkipped = skippedSlots.reduce((n, s) => n + s.qty, 0)
  const totalQtyReorder = activeQty + totalQtySkipped

  const replacedQty = skippedSlots.slice(0, selected.length).reduce((n, s) => n + s.qty, 0)

  const activePrice = packages.reduce((n, p) => n + p.items.reduce((s, i) => s + i.unitPrice * i.qty, 0), 0) +
    individuals.reduce((n, i) => n + i.unitPrice * i.qty, 0)
  const replacedPrice = skippedSlots.slice(0, selected.length).reduce((n, s) => n + s.unitPrice * s.qty, 0)
  const totalPrice = activePrice + replacedPrice

  // Membership match: all items same size and total qty matches
  const allSizeIdsReorder = [
    ...packages.flatMap(p => p.items.map(i => i.sizeId)),
    ...individuals.map(i => i.sizeId),
    ...skippedSlots.map(s => s.sizeId),
  ]
  const isMembershipMatch = Boolean(
    !usedMembershipThisWeek &&
    membership.is_member &&
    (membership.membership_weeks_left ?? 0) > 0 &&
    membership.membership_qty !== null &&
    membership.membership_size_id !== null &&
    totalQtyReorder === membership.membership_qty &&
    allSizeIdsReorder.length > 0 &&
    allSizeIdsReorder.every(sid => sid === membership.membership_size_id)
  )

  const buildItems = (): CartItem[] => {
    const result: CartItem[] = []
    packages.forEach(pkg => pkg.items.forEach(item => result.push(item)))
    individuals.forEach(item => result.push(item))
    skippedSlots.forEach((slot, idx) => {
      const rep = selected[idx]
      if (!rep) return
      result.push({
        mealId: rep.mealId,
        mealName: rep.mealName,
        sizeId: slot.sizeId,
        sizeName: slot.sizeName,
        qty: slot.qty,
        unitPrice: slot.unitPrice,
        ...(slot.packageInstanceId ? { packageInstanceId: slot.packageInstanceId, packageName: 'Arma tu paquete' } : {}),
      })
    })
    return result
  }

  const handleRepetir = () => {
    clearCart()
    buildItems().forEach(item => addItem(item))
    router.push('/checkout')
  }

  const handleMembershipOpen = () => {
    setMembershipItems(buildItems())
    setMembershipModalOpen(true)
  }

  return (
    <main style={{
      padding: '40px 24px 100px',
      minHeight: '100vh',
      background: colors.black,
      color: colors.white,
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        <h1 style={{ fontSize: 32, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 2 }}>
          <span style={{ color: colors.orange }}>Volver</span> a pedir
        </h1>
        <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 24 }}>
          Repite tu último pedido
        </p>

        {!hasItems ? (
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <p style={{ color: colors.textMuted, fontSize: 15, marginBottom: 24 }}>
              Aún no tienes pedidos anteriores.
            </p>
            <Link href="/menu" className="franchise-stroke" style={{
              display: 'inline-block', padding: '16px 32px',
              background: colors.orange, color: colors.white, borderRadius: 8,
              textDecoration: 'none', fontFamily: 'Franchise, sans-serif',
              fontSize: 22, letterSpacing: 0, lineHeight: 1, textTransform: 'uppercase',
            }}>
              Ver menú →
            </Link>
          </div>
        ) : (
          <>
            {/* Active items */}
            <div style={{ marginBottom: needed > 0 ? 8 : 24 }}>
              {packages.map((pkg, pi) => (
                <div key={pkg.instanceId} style={{
                  marginBottom: 16,
                  border: `2px solid ${colors.grayLight}`,
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: colors.grayDark,
                }}>
                  <div style={{
                    padding: 16,
                    background: colors.grayLight,
                    borderBottom: `1px solid ${colors.grayLight}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontWeight: 'bold', color: colors.orange }}>
                      Arma tu paquete · x{pkg.items.length}{packages.length > 1 ? ` (${pi + 1})` : ''}
                    </span>
                    <span style={{ fontWeight: 'bold', color: colors.white }}>
                      ${(pkg.items.reduce((s, i) => s + i.unitPrice * i.qty, 0) / 100).toFixed(0)} MXN
                    </span>
                  </div>
                  <div>
                    {pkg.items.map((item, i) => (
                      <div key={`${item.mealId}-${i}`} style={{
                        padding: '12px 16px',
                        borderBottom: i < pkg.items.length - 1 ? `1px solid ${colors.grayLight}` : 'none',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                      }}>
                        <div>
                          <span style={{ fontSize: 15, color: colors.white }}>{item.mealName}</span>
                          <span style={{ fontSize: 12, color: colors.textMuted, marginLeft: 8 }}>{item.sizeName}</span>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span style={{ fontSize: 13, color: colors.textMuted }}>
                            ×{item.qty} · ${(item.unitPrice / 100).toFixed(0)} c/u
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: colors.white, marginLeft: 10 }}>
                            ${(item.unitPrice * item.qty / 100).toFixed(0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {individuals.length > 0 && (
                <div style={{
                  marginBottom: 16,
                  border: `2px solid ${colors.grayLight}`,
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: colors.grayDark,
                }}>
                  {individuals.map((item, i) => (
                    <div key={`${item.mealId}-${item.sizeId}-${i}`} style={{
                      padding: '12px 16px',
                      borderBottom: i < individuals.length - 1 ? `1px solid ${colors.grayLight}` : 'none',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                    }}>
                      <div>
                        <span style={{ fontSize: 15, color: colors.white }}>{item.mealName}</span>
                        <span style={{ fontSize: 12, color: colors.textMuted, marginLeft: 8 }}>{item.sizeName}</span>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontSize: 13, color: colors.textMuted }}>
                          ×{item.qty} · ${(item.unitPrice / 100).toFixed(0)} c/u
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: colors.white, marginLeft: 10 }}>
                          ${(item.unitPrice * item.qty / 100).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Replacement picker */}
            {needed > 0 && (
              <div style={{
                marginBottom: 24,
                border: `2px solid #f59e0b55`,
                borderRadius: 12,
                overflow: 'hidden',
                background: colors.grayDark,
              }}>
                <div style={{
                  padding: 16,
                  background: '#f59e0b18',
                  borderBottom: `1px solid #f59e0b33`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#f59e0b' }}>
                      {needed} {needed === 1 ? 'meal no está disponible' : 'meals no están disponibles'} esta semana
                    </div>
                    <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                      Elige un reemplazo para: {skippedSlots.map(s => s.originalMealName).join(', ')}
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    background: remaining === 0 ? colors.orange + '22' : '#f59e0b18',
                    border: `1px solid ${remaining === 0 ? colors.orange + '88' : '#f59e0b55'}`,
                    borderRadius: 20,
                    fontSize: 13, fontWeight: 700,
                    color: remaining === 0 ? colors.orange : '#f59e0b',
                    whiteSpace: 'nowrap',
                  }}>
                    {selected.length} / {needed}
                  </span>
                </div>

                <div style={{
                  padding: 16,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 10,
                }}>
                  {activeMealOptions.map(opt => {
                    const count = countOf(opt.id)
                    const isSelected = count > 0
                    const canAdd = selected.length < needed
                    return (
                      <div
                        key={opt.id}
                        onClick={() => !isSelected && canAdd && addMeal(opt)}
                        style={{
                          position: 'relative',
                          background: isSelected ? colors.orange + '15' : colors.black,
                          border: `2px solid ${isSelected ? colors.orange : colors.grayLight}`,
                          borderRadius: 10,
                          overflow: 'hidden',
                          cursor: !isSelected && canAdd ? 'pointer' : 'default',
                          opacity: !isSelected && !canAdd ? 0.4 : 1,
                          transition: 'border-color 0.15s',
                        }}
                      >
                        <div style={{ width: '100%', aspectRatio: '4/3', background: '#1a1a1a', position: 'relative', overflow: 'hidden' }}>
                          {opt.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={opt.imageUrl} alt={opt.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: colors.grayLight }}>
                              🍽️
                            </div>
                          )}
                          {isSelected && (
                            <div
                              style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                background: 'rgba(0,0,0,0.65)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: 12, padding: '6px 0',
                              }}
                              onClick={e => e.stopPropagation()}
                            >
                              <button
                                onClick={e => { e.stopPropagation(); removeMeal(opt.id) }}
                                style={{
                                  width: 26, height: 26, borderRadius: '50%',
                                  background: colors.orange, border: 'none',
                                  color: colors.white, fontSize: 18, fontWeight: 700,
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                              >−</button>
                              <span style={{ color: colors.white, fontWeight: 700, fontSize: 16, minWidth: 16, textAlign: 'center' }}>
                                {count}
                              </span>
                              <button
                                onClick={e => { e.stopPropagation(); addMeal(opt) }}
                                disabled={!canAdd}
                                style={{
                                  width: 26, height: 26, borderRadius: '50%',
                                  background: canAdd ? colors.orange : colors.grayLight,
                                  border: 'none', color: colors.white, fontSize: 18, fontWeight: 700,
                                  cursor: canAdd ? 'pointer' : 'not-allowed',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                              >+</button>
                            </div>
                          )}
                        </div>
                        <div style={{
                          padding: '8px',
                          fontSize: 12,
                          fontWeight: isSelected ? 700 : 400,
                          color: isSelected ? colors.white : colors.textMuted,
                          lineHeight: 1.3,
                          textAlign: 'center',
                        }}>
                          {opt.name}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Membership banner */}
            {membership.is_member && (membership.membership_weeks_left ?? 0) > 0 && (
              <div style={{
                padding: '16px 20px',
                marginBottom: 16,
                background: isMembershipMatch ? `${colors.orange}18` : colors.grayDark,
                border: `2px solid ${isMembershipMatch ? colors.orange : colors.grayLight}`,
                borderRadius: 10,
              }}>
                {isMembershipMatch ? (
                  <div style={{ fontSize: 16, fontWeight: 700, color: colors.orange }}>
                    Tu pedido está cubierto por tu Membresía Muscle Meals
                  </div>
                ) : usedMembershipThisWeek ? (
                  <div style={{ fontSize: 13, color: colors.textMuted }}>
                    Ya usaste tu membresía esta semana — paga normalmente para este pedido
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: colors.textMuted }}>
                    Tu carrito actual no coincide con tu Membresía Muscle Meals, verifica tu pedido o paga normalmente
                  </div>
                )}
              </div>
            )}

            {/* Total */}
            <div style={{
              padding: 20,
              background: colors.grayDark,
              border: `2px solid ${colors.orange}`,
              borderRadius: 12,
              marginBottom: 24,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 18, fontWeight: 'bold', color: colors.white }}>Total:</span>
                {isMembershipMatch ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20, color: colors.textMuted, textDecoration: 'line-through' }}>
                      ${(totalPrice / 100).toFixed(0)} MXN
                    </span>
                    <span style={{ fontSize: 28, fontWeight: 'bold', color: colors.orange }}>
                      $0 MXN
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: 28, fontWeight: 'bold', color: colors.orange }}>
                    ${(totalPrice / 100).toFixed(0)} MXN
                  </span>
                )}
              </div>
            </div>

            {/* Action button */}
            {isMembershipMatch ? (
              <button
                onClick={handleMembershipOpen}
                disabled={!canProceed}
                className={canProceed ? 'franchise-stroke' : undefined}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  background: canProceed ? colors.orange : colors.grayDark,
                  color: canProceed ? colors.white : colors.textMuted,
                  border: canProceed ? 'none' : `1px solid ${colors.grayLight}`,
                  borderRadius: 8,
                  fontFamily: 'Franchise, sans-serif',
                  fontSize: canProceed ? 22 : 16,
                  letterSpacing: 0,
                  lineHeight: 1,
                  textTransform: 'uppercase',
                  cursor: canProceed ? 'pointer' : 'not-allowed',
                }}
              >
                {remaining > 0 ? `Elige ${remaining} más para continuar` : 'Confirmar con membresía'}
              </button>
            ) : (
              <button
                onClick={handleRepetir}
                disabled={!canProceed}
                className={canProceed ? 'franchise-stroke' : undefined}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  background: canProceed ? colors.orange : colors.grayDark,
                  color: canProceed ? colors.white : colors.textMuted,
                  border: canProceed ? 'none' : `1px solid ${colors.grayLight}`,
                  borderRadius: 8,
                  fontFamily: 'Franchise, sans-serif',
                  fontSize: canProceed ? 22 : 16,
                  letterSpacing: 0,
                  lineHeight: 1,
                  textTransform: 'uppercase',
                  cursor: canProceed ? 'pointer' : 'not-allowed',
                }}
              >
                {remaining > 0 ? `Elige ${remaining} más para continuar` : 'Volver a pedir →'}
              </button>
            )}
          </>
        )}
      </div>

      {membershipModalOpen && (
        <MembershipConfirmModal
          prefill={prefill}
          pickupSpots={pickupSpots}
          items={membershipItems}
          subtotal={totalPrice}
          onClose={() => setMembershipModalOpen(false)}
        />
      )}
    </main>
  )
}
