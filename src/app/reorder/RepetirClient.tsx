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

export default function RepetirClient({
  packages, individuals, skippedSlots, activeMealOptions, orderDate, orderNumber,
}: Props) {
  const router = useRouter()
  const { addItem, clearCart } = useCartStore()
  const [replacements, setReplacements] = useState<Map<string, { mealId: string; mealName: string }>>(new Map())
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null)

  const hasItems = packages.length > 0 || individuals.length > 0 || skippedSlots.length > 0
  const pendingSlots = skippedSlots.filter(s => !replacements.has(s.key))
  const canProceed = hasItems && pendingSlots.length === 0

  const formattedDate = orderDate
    ? new Date(orderDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const selectReplacement = (slotKey: string, mealId: string, mealName: string) => {
    setReplacements(prev => new Map(prev).set(slotKey, { mealId, mealName }))
    setExpandedSlot(null)
  }

  const handleRepetir = () => {
    clearCart()
    packages.forEach(pkg => pkg.items.forEach(item => addItem(item)))
    individuals.forEach(item => addItem(item))
    skippedSlots.forEach(slot => {
      const rep = replacements.get(slot.key)
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
  const replacedQty = skippedSlots.filter(s => replacements.has(s.key)).reduce((n, s) => n + s.qty, 0)
  const totalItems = activeQty + replacedQty

  const activePrice =
    packages.reduce((n, p) => n + p.items.reduce((s, i) => s + i.unitPrice * i.qty, 0), 0) +
    individuals.reduce((n, i) => n + i.unitPrice * i.qty, 0)
  const replacedPrice = skippedSlots.filter(s => replacements.has(s.key)).reduce((n, s) => n + s.unitPrice * s.qty, 0)
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
            <Link
              href="/menu"
              className="franchise-stroke"
              style={{
                display: 'inline-block',
                padding: '14px 28px',
                background: colors.orange,
                color: colors.white,
                borderRadius: 8,
                textDecoration: 'none',
                fontFamily: 'Franchise, sans-serif',
                fontSize: 20,
                letterSpacing: 0,
                lineHeight: 1,
                textTransform: 'uppercase',
              }}
            >
              Ver menú →
            </Link>
          </div>
        ) : (
          <>
            <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 24 }}>
              {formattedDate ? `Repite tu pedido del ${formattedDate}` : 'Tu último pedido'}
              {orderNumber && (
                <span style={{ color: colors.grayLight, marginLeft: 8, fontSize: 12 }}>{orderNumber}</span>
              )}
            </p>

            {/* Active items */}
            {(packages.length > 0 || individuals.length > 0) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: skippedSlots.length > 0 ? 24 : 0 }}>
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
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
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
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                      }}>
                        <span style={{ fontSize: 14, color: colors.white }}>{item.mealName}</span>
                        <span style={{ fontSize: 12, color: colors.textMuted, flexShrink: 0 }}>{item.sizeName}</span>
                      </div>
                    ))}
                  </div>
                ))}

                {individuals.length > 0 && (
                  <div style={{
                    background: colors.grayDark,
                    border: `1px solid ${colors.grayLight}`,
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}>
                    {packages.length > 0 && (
                      <div style={{
                        padding: '8px 16px',
                        borderBottom: `1px solid ${colors.grayLight}`,
                        color: colors.textMuted,
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>
                        Individual
                      </div>
                    )}
                    {individuals.map((item, i) => (
                      <div key={`${item.mealId}-${item.sizeId}-${i}`} style={{
                        padding: '12px 16px',
                        borderBottom: i < individuals.length - 1 ? `1px solid ${colors.grayLight}` : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
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

            {/* Replacement slots */}
            {skippedSlots.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#f59e0b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 10,
                }}>
                  {skippedSlots.length === 1
                    ? 'Platillo no disponible esta semana'
                    : `${skippedSlots.length} platillos no disponibles esta semana`}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {skippedSlots.map(slot => {
                    const rep = replacements.get(slot.key)
                    const isExpanded = expandedSlot === slot.key
                    return (
                      <div key={slot.key} style={{
                        background: colors.grayDark,
                        border: `1px solid ${rep ? colors.orange + '66' : '#f59e0b33'}`,
                        borderRadius: 12,
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          padding: '12px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 12,
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {rep ? (
                              <>
                                <span style={{ fontSize: 14, color: colors.white }}>{rep.mealName}</span>
                                <span style={{ fontSize: 12, color: colors.textMuted, marginLeft: 6 }}>{slot.sizeName}</span>
                                <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                                  reemplaza {slot.originalMealName}
                                </div>
                              </>
                            ) : (
                              <>
                                <span style={{ fontSize: 14, color: colors.textMuted, textDecoration: 'line-through' }}>
                                  {slot.originalMealName}
                                </span>
                                <span style={{ fontSize: 12, color: colors.textMuted, marginLeft: 6 }}>{slot.sizeName}</span>
                                <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 2 }}>No disponible</div>
                              </>
                            )}
                          </div>
                          <button
                            onClick={() => setExpandedSlot(isExpanded ? null : slot.key)}
                            style={{
                              padding: '6px 12px',
                              background: 'transparent',
                              border: `1px solid ${rep ? colors.grayLight : '#f59e0b66'}`,
                              borderRadius: 6,
                              color: rep ? colors.textMuted : '#f59e0b',
                              fontSize: 12,
                              cursor: 'pointer',
                              flexShrink: 0,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {rep ? 'Cambiar' : 'Elegir reemplazo'}
                          </button>
                        </div>

                        {isExpanded && (
                          <div style={{
                            borderTop: `1px solid ${colors.grayLight}`,
                            padding: '12px 16px',
                          }}>
                            <p style={{ fontSize: 12, color: colors.textMuted, marginBottom: 10 }}>
                              Elige con cuál lo reemplazas:
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {activeMealOptions.map(opt => (
                                <button
                                  key={opt.id}
                                  onClick={() => selectReplacement(slot.key, opt.id, opt.name)}
                                  style={{
                                    padding: '7px 14px',
                                    background: rep?.mealId === opt.id ? colors.orange : colors.black,
                                    border: `1px solid ${rep?.mealId === opt.id ? colors.orange : colors.grayLight}`,
                                    borderRadius: 20,
                                    color: rep?.mealId === opt.id ? colors.white : colors.textMuted,
                                    fontSize: 13,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {opt.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Total */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderTop: `1px solid ${colors.grayLight}`,
              marginBottom: 20,
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
              {pendingSlots.length > 0
                ? `Elige ${pendingSlots.length} reemplazo${pendingSlots.length > 1 ? 's' : ''} para continuar`
                : 'Volver a pedir →'}
            </button>
          </>
        )}
      </div>
    </main>
  )
}
