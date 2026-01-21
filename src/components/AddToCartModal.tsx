'use client'

import Image from 'next/image'
import type { MealBasic, Size } from '@/lib/types'
import { colors } from '@/lib/theme'
import Modal from './Modal'

interface AddToCartModalProps {
  isOpen: boolean
  onClose: () => void
  onContinueShopping: () => void
  title: string
  message: string
  suggestedMeals: MealBasic[]
  selectedSize: Size | undefined
  onMealClick: (mealId: string) => void
}

/**
 * Modal reutilizable para confirmación de agregar al carrito
 * Incluye sugerencias de platillos adicionales
 */
export default function AddToCartModal({
  isOpen,
  onClose,
  onContinueShopping,
  title,
  message,
  suggestedMeals,
  selectedSize,
  onMealClick
}: AddToCartModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div style={{ padding: 48, textAlign: 'center' }}>
        {/* Ícono de éxito */}
        <div style={{
          width: 80,
          height: 80,
          background: colors.orange,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: 40
        }}>
          ✓
        </div>

        <h2 style={{ 
          fontSize: 28, 
          marginBottom: 16,
          color: colors.orange
        }}>
          {title}
        </h2>

        <p style={{ 
          fontSize: 16, 
          color: colors.textSecondary,
          marginBottom: 32
        }}>
          {message}
        </p>

        {/* Botones */}
        <div style={{ 
          display: 'flex', 
          gap: 12,
          flexDirection: 'column',
          marginBottom: suggestedMeals.length > 0 && selectedSize ? 32 : 0
        }}>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '16px 32px',
              fontSize: 18,
              fontWeight: 'bold',
              background: colors.orange,
              color: colors.black,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            OK
          </button>

          <button
            onClick={onContinueShopping}
            style={{
              width: '100%',
              padding: '16px 32px',
              fontSize: 16,
              fontWeight: 'bold',
              background: 'transparent',
              color: colors.orange,
              border: `2px solid ${colors.orange}`,
              borderRadius: 8,
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            Continuar comprando
          </button>
        </div>

        {/* Sugerencias de platillos */}
        {suggestedMeals.length > 0 && (
          <div style={{ 
            borderTop: `2px solid ${colors.grayLight}`, 
            paddingTop: 24,
            textAlign: 'left'
          }}>
            <h3 style={{ 
              fontSize: 18, 
              marginBottom: 16, 
              color: colors.white,
              textAlign: 'center'
            }}>
              Otros platillos disponibles
            </h3>
            
            <div style={{
              display: 'grid',
              gap: 12,
              maxHeight: 300,
              overflow: 'auto'
            }}>
              {suggestedMeals.slice(0, 8).map(meal => (
                <button
                  key={meal.id}
                  onClick={() => onMealClick(meal.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    background: colors.grayDark,
                    border: `2px solid ${colors.grayLight}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = colors.orange
                    e.currentTarget.style.background = colors.grayLight
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.grayLight
                    e.currentTarget.style.background = colors.grayDark
                  }}
                >
                  {meal.img ? (
                    <Image
                      src={meal.img}
                      alt={meal.name}
                      width={60}
                      height={60}
                      style={{ 
                        width: 60, 
                        height: 60, 
                        objectFit: 'cover', 
                        borderRadius: 6 
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 60,
                      height: 60,
                      background: colors.black,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24
                    }}>
                      🍽️
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: 15, 
                      fontWeight: 'bold',
                      color: colors.white,
                      marginBottom: 4
                    }}>
                      {meal.name}
                    </div>
                    <div style={{ 
                      fontSize: 12, 
                      color: colors.textMuted 
                    }}>
                      Ver platillo →
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
