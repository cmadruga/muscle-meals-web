'use client'

import Image from 'next/image'
import type { MealBasic, Size } from '@/lib/types'
import { colors } from '@/lib/theme'
import Modal from './Modal'

interface AddToCartModalProps {
  isOpen: boolean
  onClose: () => void
  onGoToCart: () => void
  onContinueShopping: () => void
  title: string
  message: string
  suggestedMeals: MealBasic[]
  selectedSize: Size | undefined
  onMealClick: (mealId: string, sizeId?: string) => void
}

/**
 * Modal reutilizable para confirmación de agregar al carrito
 * Incluye carrusel de todos los platillos disponibles
 */
export default function AddToCartModal({
  isOpen,
  onClose,
  onGoToCart,
  onContinueShopping,
  title,
  message,
  suggestedMeals,
  selectedSize,
  onMealClick
}: AddToCartModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <style>{`
        .atc-body { padding: 48px 48px 32px; }
        .atc-meals-section { margin: 0 -48px; padding: 24px 0 0; }
        .atc-meals-grid { padding: 4px 24px 16px; }
        @media (max-width: 640px) {
          .atc-body { padding: 32px 20px 24px; }
          .atc-meals-section { margin: 0 -20px; padding: 20px 0 0; }
          .atc-meals-grid { padding: 4px 16px 16px; overflow-x: auto; display: flex; gap: 10px; }
          .atc-meals-grid > button { flex-shrink: 0; width: 100px; }
        }
      `}</style>
      <div className="atc-body" style={{ textAlign: 'center' }}>
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

        <h2 style={{ fontSize: 28, marginBottom: 16, color: colors.orange }}>
          {title}
        </h2>

        <p style={{ fontSize: 16, color: colors.textSecondary, marginBottom: 32 }}>
          {message}
        </p>

        {/* Botones */}
        <div style={{
          display: 'flex',
          gap: 12,
          flexDirection: 'column',
          marginBottom: suggestedMeals.length > 0 ? 32 : 0
        }}>
          <button
            onClick={onGoToCart}
            className="franchise-stroke"
            style={{
              width: '100%',
              padding: '16px 32px',
              background: colors.orange,
              color: colors.white,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: 'Franchise, sans-serif',
              fontSize: 22,
              letterSpacing: 0,
              lineHeight: 1,
              textTransform: 'uppercase',
            }}
          >
            Ir al carrito
          </button>

          <button
            onClick={onContinueShopping}
            style={{
              width: '100%',
              padding: '16px 32px',
              background: 'transparent',
              color: colors.orange,
              border: `2px solid ${colors.orange}`,
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: 'Franchise, sans-serif',
              fontSize: 20,
              letterSpacing: 0,
              lineHeight: 1,
              textTransform: 'uppercase',
            }}
          >
            Continuar comprando
          </button>
        </div>

        {/* Carrusel de platillos */}
        {suggestedMeals.length > 0 && (
          <div className="atc-meals-section" style={{
            borderTop: `2px solid ${colors.grayLight}`,
            textAlign: 'left',
          }}>
            <h3 style={{
              fontSize: 15,
              marginBottom: 14,
              color: colors.textSecondary,
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: 1,
              fontWeight: 700,
            }}>
              Agregar más individuales
            </h3>

            {/* Grid que llena el ancho */}
            <div className="atc-meals-grid" style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${suggestedMeals.length}, 1fr)`,
              gap: 10,
            }}>
              {suggestedMeals.map(meal => (
                <button
                  key={meal.id}
                  onClick={() => onMealClick(meal.id, selectedSize?.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 8px',
                    background: colors.grayDark,
                    border: `2px solid ${colors.grayLight}`,
                    borderRadius: 10,
                    cursor: 'pointer',
                    textAlign: 'center',
                    minWidth: 0,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = colors.orange
                    e.currentTarget.style.background = colors.grayLight
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = colors.grayLight
                    e.currentTarget.style.background = colors.grayDark
                  }}
                >
                  {meal.img ? (
                    <Image
                      src={meal.img}
                      alt={meal.name}
                      width={90}
                      height={70}
                      style={{ width: '100%', height: 70, objectFit: 'cover', borderRadius: 6 }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: 70,
                      background: colors.black,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 28,
                    }}>
                      🍽️
                    </div>
                  )}
                  <div style={{
                    fontFamily: 'Franchise, sans-serif',
                    fontSize: 14,
                    letterSpacing: 0,
                    color: colors.white,
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical' as React.CSSProperties['WebkitBoxOrient'],
                  }}>
                    {meal.name}
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
