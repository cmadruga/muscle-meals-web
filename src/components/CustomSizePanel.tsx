'use client'

import { useState } from 'react'
import type { Size } from '@/lib/types'
import { calculateCustomSizePrice } from '@/lib/utils/pricing'
import { toCocido, toCrudo } from '@/lib/utils/conversions'
import { createCustomSize } from '@/app/actions/sizes'
import { colors } from '@/lib/theme'

interface CustomSizePanelProps {
  onSizeCreated: (size: Size) => void
  mealsIncluded?: number // si viene de vista paquete, muestra precio total
}

type ViewMode = 'crudo' | 'cocido'

export default function CustomSizePanel({ onSizeCreated, mealsIncluded }: CustomSizePanelProps) {
  // Siempre en crudo internamente
  const [proteinQty, setProteinQty] = useState(180)
  const [carbQty, setCarbQty] = useState(55)
  const [vegQty, setVegQty] = useState(70)
  const [name, setName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('crudo')

  const { price, packagePrice } = calculateCustomSizePrice(proteinQty, carbQty, vegQty)

  // Redondea al múltiplo de 5 más cercano
  const r5 = (n: number) => Math.round(n / 5) * 5

  // Helpers: convierte raw→display y display→raw según modo
  const toDisplay = (raw: number, type: 'protein' | 'carbs' | 'veg') =>
    viewMode === 'crudo' ? raw : toCocido(raw, type)

  const fromDisplay = (display: number, type: 'protein' | 'carbs' | 'veg') =>
    viewMode === 'crudo' ? r5(display) : r5(toCrudo(display, type))

  // Max en modo cocido (referencia visual)
  const maxDisplay = (rawMax: number, type: 'protein' | 'carbs' | 'veg') =>
    viewMode === 'crudo' ? rawMax : toCocido(rawMax, type)

  const handleProteinInput = (val: number) => {
    setProteinQty(Math.min(250, Math.max(0, fromDisplay(val, 'protein'))))
  }
  const handleCarbInput = (val: number) => {
    setCarbQty(Math.min(100, Math.max(0, fromDisplay(val, 'carbs'))))
  }
  const handleVegInput = (val: number) => {
    setVegQty(Math.min(150, Math.max(0, fromDisplay(val, 'veg'))))
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('El nombre es requerido')
      return
    }
    setIsCreating(true)
    setError(null)

    const result = await createCustomSize({
      name,
      protein_qty: proteinQty,
      carb_qty: carbQty,
      veg_qty: vegQty,
    })

    if (result.error) {
      setError(result.error)
      setIsCreating(false)
      return
    }

    if (result.size) {
      onSizeCreated(result.size)
    }
    setIsCreating(false)
  }

  const unit = viewMode === 'crudo' ? 'g crudo' : 'g cocido'

  const sliderStyle = {
    width: '100%',
    accentColor: colors.orange,
    cursor: 'pointer',
  }

  const numberInputStyle = {
    width: 64,
    padding: '4px 8px',
    fontSize: 14,
    borderRadius: 6,
    border: `1px solid ${colors.grayLight}`,
    background: colors.black,
    color: colors.white,
    textAlign: 'center' as const,
  }

  return (
    <div style={{
      marginTop: 12,
      padding: 20,
      background: colors.black,
      borderRadius: 10,
      border: `2px solid ${colors.orange}`,
    }}>
      {/* Header + toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h4 style={{ margin: 0, color: colors.orange, fontSize: 15 }}>
          Crear tamaño personalizado
        </h4>

        {/* Toggle pill */}
        <div style={{
          display: 'flex',
          background: colors.grayDark,
          borderRadius: 20,
          padding: 3,
          gap: 2,
          border: `1px solid ${colors.grayLight}`,
        }}>
          <button
            onClick={() => setViewMode('crudo')}
            style={{
              padding: '4px 12px',
              borderRadius: 16,
              background: viewMode === 'crudo' ? colors.orange : 'transparent',
              color: viewMode === 'crudo' ? colors.black : colors.textMuted,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 12,
              transition: 'background 0.15s',
            }}
          >
            Crudo
          </button>
          <button
            onClick={() => setViewMode('cocido')}
            style={{
              padding: '4px 12px',
              borderRadius: 16,
              background: viewMode === 'cocido' ? colors.orange : 'transparent',
              color: viewMode === 'cocido' ? colors.black : colors.textMuted,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 12,
              transition: 'background 0.15s',
            }}
          >
            Cocido
          </button>
        </div>
      </div>

      {/* Aviso modo cocido */}
      {viewMode === 'cocido' && (
        <div style={{
          fontSize: 12,
          color: colors.textMuted,
          background: colors.grayDark,
          borderRadius: 6,
          padding: '6px 10px',
          marginBottom: 14,
          borderLeft: `3px solid ${colors.orange}`,
        }}>
          Ingresa los gramos que quieres recibir ya cocinados. Lo guardamos como crudo internamente.
        </div>
      )}

      {/* Nombre */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, color: colors.textSecondary, marginBottom: 6 }}>
          Nombre del tamaño (ej: &quot;Mi Tamaño&quot;)
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ej: Mi Tamaño"
          maxLength={50}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 15,
            borderRadius: 8,
            border: `1px solid ${colors.grayLight}`,
            background: colors.grayDark,
            color: colors.white,
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Proteína */}
      <SliderRow
        label="Proteína"
        unit={unit}
        displayValue={toDisplay(proteinQty, 'protein')}
        rawValue={proteinQty}
        maxDisplay={maxDisplay(250, 'protein')}
        onDisplayChange={handleProteinInput}
        onSliderChange={v => setProteinQty(v)}
        rawMax={250}
        sliderStyle={sliderStyle}
        numberInputStyle={numberInputStyle}
        viewMode={viewMode}
        cocidoHint={viewMode === 'crudo' ? `≈ ${toCocido(proteinQty, 'protein')}g cocido` : undefined}
        crudoHint={viewMode === 'cocido' ? `(${proteinQty}g crudo)` : undefined}
      />

      {/* Carbos */}
      <SliderRow
        label="Carbohidratos"
        unit={unit}
        displayValue={toDisplay(carbQty, 'carbs')}
        rawValue={carbQty}
        maxDisplay={maxDisplay(100, 'carbs')}
        onDisplayChange={handleCarbInput}
        onSliderChange={v => setCarbQty(v)}
        rawMax={100}
        sliderStyle={sliderStyle}
        numberInputStyle={numberInputStyle}
        viewMode={viewMode}
        cocidoHint={viewMode === 'crudo' ? `≈ ${toCocido(carbQty, 'carbs')}g cocido` : undefined}
        crudoHint={viewMode === 'cocido' ? `(${carbQty}g crudo)` : undefined}
      />

      {/* Verduras */}
      <SliderRow
        label="Verduras"
        unit={unit}
        displayValue={toDisplay(vegQty, 'veg')}
        rawValue={vegQty}
        maxDisplay={maxDisplay(150, 'veg')}
        onDisplayChange={handleVegInput}
        onSliderChange={v => setVegQty(v)}
        rawMax={150}
        sliderStyle={sliderStyle}
        numberInputStyle={numberInputStyle}
        viewMode={viewMode}
        cocidoHint={viewMode === 'crudo' ? `≈ ${toCocido(vegQty, 'veg')}g cocido` : undefined}
        crudoHint={viewMode === 'cocido' ? `(${vegQty}g crudo)` : undefined}
        lastItem
      />

      {/* Precio calculado */}
      <div style={{
        padding: '10px 14px',
        background: colors.grayDark,
        borderRadius: 8,
        marginBottom: 14,
        fontSize: 14,
        color: colors.white,
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>
          Precio: <strong style={{ color: colors.orange }}>${(price / 100).toFixed(0)} MXN</strong>
        </span>
        <span style={{ color: colors.textMuted }}>
          {mealsIncluded
            ? `Paquete total: $${(packagePrice * mealsIncluded / 100).toFixed(0)} MXN (${mealsIncluded} comidas)`
            : `Paquete: $${(packagePrice / 100).toFixed(0)} MXN`}
        </span>
      </div>

      {/* Error */}
      {error && (
        <p style={{ color: colors.error, fontSize: 13, marginBottom: 10 }}>
          {error}
        </p>
      )}

      {/* Botón guardar */}
      <button
        onClick={handleSubmit}
        disabled={isCreating}
        style={{
          width: '100%',
          padding: '12px 16px',
          fontSize: 15,
          fontWeight: 'bold',
          cursor: isCreating ? 'not-allowed' : 'pointer',
          opacity: isCreating ? 0.6 : 1,
          background: colors.orange,
          color: colors.black,
          border: 'none',
          borderRadius: 8,
          textTransform: 'uppercase',
        }}
      >
        {isCreating ? 'Creando...' : 'Crear y usar este tamaño'}
      </button>
    </div>
  )
}

// ─── Componente auxiliar para cada fila slider ─────────────────────────────
interface SliderRowProps {
  label: string
  unit: string
  displayValue: number
  rawValue: number
  maxDisplay: number
  rawMax: number
  onDisplayChange: (val: number) => void
  onSliderChange: (val: number) => void
  sliderStyle: React.CSSProperties
  numberInputStyle: React.CSSProperties
  viewMode: ViewMode
  cocidoHint?: string
  crudoHint?: string
  lastItem?: boolean
}

function SliderRow({
  label, unit, displayValue, rawValue, maxDisplay, rawMax,
  onDisplayChange, onSliderChange,
  sliderStyle, numberInputStyle,
  viewMode, cocidoHint, crudoHint, lastItem,
}: SliderRowProps) {
  return (
    <div style={{ marginBottom: lastItem ? 16 : 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 'bold', color: colors.white, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Hint del otro modo */}
          {(cocidoHint || crudoHint) && (
            <span style={{ fontSize: 11, color: colors.textTertiary }}>
              {cocidoHint || crudoHint}
            </span>
          )}
          <input
            type="number"
            min={0}
            max={maxDisplay}
            value={displayValue}
            onChange={e => onDisplayChange(Number(e.target.value))}
            style={numberInputStyle}
          />
          <span style={{ fontSize: 11, color: colors.textTertiary, minWidth: 48 }}>{unit}</span>
        </div>
      </div>

      {/* Slider siempre en crudo, paso de 5 en 5 */}
      <input
        type="range"
        min={0}
        max={rawMax}
        step={5}
        value={rawValue}
        onChange={e => onSliderChange(Number(e.target.value))}
        style={sliderStyle}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: colors.textTertiary }}>
        <span>0</span>
        <span>{maxDisplay}g</span>
      </div>
    </div>
  )
}
