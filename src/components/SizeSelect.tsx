'use client'

import { useState, useRef, useEffect } from 'react'
import type { Size } from '@/lib/types'
import { colors } from '@/lib/theme'

interface SizeSelectProps {
  mainSizes: Size[]
  customerSizes: Size[]
  sessionSizes: Size[]
  selectedId: string
  onChange: (id: string) => void
  formatOption: (size: Size) => string
}

export default function SizeSelect({
  mainSizes,
  customerSizes,
  sessionSizes,
  selectedId,
  onChange,
  formatOption,
}: SizeSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const allSizes = [...mainSizes, ...customerSizes, ...sessionSizes]
  const selectedSize = allSizes.find(s => s.id === selectedId)
  const isCustom = selectedId === '__custom__'
  const hasMiTalla = customerSizes.length > 0 || sessionSizes.length > 0

  useEffect(() => {
    if (!isOpen) return
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [isOpen])

  const select = (id: string) => {
    onChange(id)
    setIsOpen(false)
  }

  const triggerText = isCustom
    ? '＋ Crear tamaño personalizado…'
    : selectedSize ? formatOption(selectedSize) : '—'

  const groupLabel: React.CSSProperties = {
    padding: '8px 16px 4px',
    fontSize: 10,
    fontWeight: 700,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    background: colors.black,
    userSelect: 'none',
  }

  const itemBase = (id: string): React.CSSProperties => ({
    padding: '12px 16px',
    cursor: 'pointer',
    color: selectedId === id ? colors.orange : colors.white,
    background: selectedId === id ? 'rgba(255,122,0,0.12)' : 'transparent',
    fontSize: 15,
    fontWeight: selectedId === id ? 600 : 400,
    borderBottom: `1px solid ${colors.grayLight}`,
  })

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(o => !o)}
        onKeyDown={e => e.key === 'Enter' && setIsOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '14px',
          fontSize: 16,
          borderRadius: 8,
          border: `2px solid ${isOpen ? colors.orange : colors.grayLight}`,
          background: colors.grayDark,
          color: isCustom ? colors.orange : colors.white,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span>{triggerText}</span>
        <span style={{ color: colors.textMuted, fontSize: 11, flexShrink: 0 }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: colors.grayDark,
          border: `2px solid ${colors.orange}`,
          borderRadius: 8,
          zIndex: 300,
          boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
          overflow: 'hidden',
        }}>
          {/* Originales */}
          <div style={groupLabel}>Originales</div>
          {mainSizes.map(size => (
            <div
              key={size.id}
              style={itemBase(size.id)}
              onClick={() => select(size.id)}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
              onMouseLeave={e => { e.currentTarget.style.background = selectedId === size.id ? 'rgba(255,122,0,0.12)' : 'transparent' }}
            >
              {formatOption(size)}
            </div>
          ))}

          {/* Mi talla */}
          {hasMiTalla && (
            <>
              <div style={groupLabel}>Mi talla</div>
              {[...customerSizes, ...sessionSizes].map(size => (
                <div
                  key={size.id}
                  style={itemBase(size.id)}
                  onClick={() => select(size.id)}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = selectedId === size.id ? 'rgba(255,122,0,0.12)' : 'transparent' }}
                >
                  {formatOption(size)}
                </div>
              ))}
            </>
          )}

          {/* Crear personalizado */}
          <div
            style={{ ...itemBase('__custom__'), color: colors.orange, borderBottom: 'none' }}
            onClick={() => select('__custom__')}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,122,0,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = isCustom ? 'rgba(255,122,0,0.12)' : 'transparent' }}
          >
            ＋ Crear tamaño personalizado…
          </div>
        </div>
      )}
    </div>
  )
}
