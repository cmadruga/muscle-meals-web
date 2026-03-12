'use client'

import { useState, useTransition } from 'react'
import type { Material } from '@/lib/types'
import { colors } from '@/lib/theme'
import { updateMaterialStock } from '@/app/actions/materials'

// ─── Stock status helpers ─────────────────────────────────────────────────────

type StockStatus = 'ok' | 'bajo' | 'critico'

function getStatus(cantActual: number, stockMinimo: number): StockStatus {
  if (cantActual <= stockMinimo) return 'critico'
  if (cantActual <= stockMinimo * 1.5) return 'bajo'
  return 'ok'
}

const STATUS_COLOR: Record<StockStatus, string> = {
  ok: '#22c55e',
  bajo: '#eab308',
  critico: '#ef4444',
}

const STATUS_LABEL: Record<StockStatus, string> = {
  ok: 'OK',
  bajo: 'Bajo',
  critico: 'Crítico',
}

// ─── Stock update modal ───────────────────────────────────────────────────────

function StockModal({ material, onClose }: { material: Material; onClose: () => void }) {
  const [value, setValue] = useState(material.cant_actual)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function handleSave() {
    setError('')
    startTransition(async () => {
      const result = await updateMaterialStock(material.id, value)
      if (result.error) setError(result.error)
      else onClose()
    })
  }

  const inputStyle: React.CSSProperties = {
    background: colors.grayDark,
    border: `1px solid ${colors.grayLight}`,
    borderRadius: 8,
    padding: '10px 14px',
    color: colors.white,
    fontSize: 20,
    fontWeight: 700,
    width: 120,
    textAlign: 'center',
    boxSizing: 'border-box',
  }

  const stepBtn = (disabled: boolean): React.CSSProperties => ({
    width: 44, height: 44, borderRadius: 8,
    border: `1px solid ${colors.grayLight}`,
    background: disabled ? 'transparent' : colors.grayDark,
    color: disabled ? colors.textMuted : colors.white,
    fontSize: 22, fontWeight: 700,
    cursor: disabled ? 'default' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  })

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000000bb', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: colors.grayDark, borderRadius: 12, padding: 32,
        width: '100%', maxWidth: 340, border: `1px solid ${colors.grayLight}`,
        textAlign: 'center',
      }}>
        <h3 style={{ color: colors.white, fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
          {material.name}
        </h3>
        <p style={{ color: colors.textMuted, fontSize: 13, marginBottom: 28 }}>
          Actualizar cantidad en stock
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
          <button
            style={stepBtn(value <= 0)}
            onClick={() => setValue(v => Math.max(0, v - 1))}
            disabled={value <= 0}
          >−</button>

          <input
            type="number"
            min={0}
            value={value}
            onChange={e => setValue(parseFloat(e.target.value) || 0)}
            style={inputStyle}
          />

          <button
            style={stepBtn(false)}
            onClick={() => setValue(v => v + 1)}
          >+</button>
        </div>

        {error && (
          <p style={{ color: colors.error, fontSize: 13, marginBottom: 16 }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${colors.grayLight}`, background: 'transparent', color: colors.textMuted, cursor: 'pointer', fontSize: 14 }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={pending}
            style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: colors.orange, color: colors.white, cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: pending ? 0.7 : 1 }}
          >
            {pending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type StatusFilter = 'todos' | 'ok' | 'bajo' | 'critico'

export default function StockTable({ materials }: { materials: Material[] }) {
  const [editing, setEditing] = useState<Material | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos')
  const [restockingId, setRestockingId] = useState<string | null>(null)
  const [restockPending, startRestock] = useTransition()

  function handleRestock(m: Material) {
    setRestockingId(m.id)
    startRestock(async () => {
      await updateMaterialStock(m.id, m.cant_actual + m.cant)
      setRestockingId(null)
    })
  }

  const filtered = materials.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase())
    const status = getStatus(m.cant_actual, m.stock_minimo)
    const matchStatus = statusFilter === 'todos' || status === statusFilter
    return matchSearch && matchStatus
  })

  const criticoCount = materials.filter((m) => getStatus(m.cant_actual, m.stock_minimo) === 'critico').length
  const bajoCount = materials.filter((m) => getStatus(m.cant_actual, m.stock_minimo) === 'bajo').length

  const filterBtn = (active: boolean): React.CSSProperties => ({
    padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
    border: `1px solid ${active ? colors.orange : colors.grayLight}`,
    background: active ? colors.orange + '22' : 'transparent',
    color: active ? colors.orange : colors.textMuted,
    fontWeight: active ? 600 : 400,
  })

  return (
    <div>
      {/* Summary badges */}
      {(criticoCount > 0 || bajoCount > 0) && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          {criticoCount > 0 && (
            <span style={{ background: '#ef444422', border: '1px solid #ef444455', borderRadius: 8, padding: '5px 12px', color: '#ef4444', fontSize: 13, fontWeight: 600 }}>
              {criticoCount} crítico{criticoCount > 1 ? 's' : ''}
            </span>
          )}
          {bajoCount > 0 && (
            <span style={{ background: '#eab30822', border: '1px solid #eab30855', borderRadius: 8, padding: '5px 12px', color: '#eab308', fontSize: 13, fontWeight: 600 }}>
              {bajoCount} bajo stock
            </span>
          )}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar material…"
          style={{ flex: 1, minWidth: 160, background: colors.grayDark, border: `1px solid ${colors.grayLight}`, borderRadius: 8, padding: '7px 12px', color: colors.white, fontSize: 14 }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setStatusFilter('todos')} style={filterBtn(statusFilter === 'todos')}>Todos</button>
          <button onClick={() => setStatusFilter('ok')} style={filterBtn(statusFilter === 'ok')}>OK</button>
          <button onClick={() => setStatusFilter('bajo')} style={filterBtn(statusFilter === 'bajo')}>Bajo stock</button>
          <button onClick={() => setStatusFilter('critico')} style={filterBtn(statusFilter === 'critico')}>Crítico</button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
              {['dot', 'Nombre', 'Stock actual', 'Stock mín.', 'Resta', 'acciones'].map((h) => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: colors.textMuted, fontWeight: 600, whiteSpace: 'nowrap' }}>{h === 'dot' || h === 'acciones' ? '' : h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => {
              const status = getStatus(m.cant_actual, m.stock_minimo)
              const dotColor = STATUS_COLOR[status]
              const cantColor = status === 'ok' ? colors.white : dotColor
              const restaLabel = m.resta_tipo === 'orden'
                ? `Por orden ×${m.resta_cant}`
                : `${m.resta_cant} / sem`

              return (
                <tr key={m.id} style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
                  <td style={{ padding: '12px 12px 12px 16px' }}>
                    <div
                      title={STATUS_LABEL[status]}
                      style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor }}
                    />
                  </td>
                  <td style={{ padding: '12px', color: colors.white, fontWeight: 500 }}>{m.name}</td>
                  <td style={{ padding: '12px', color: cantColor, fontWeight: 700, fontSize: 15 }}>{m.cant_actual}</td>
                  <td style={{ padding: '12px', color: colors.textSecondary }}>{m.stock_minimo}</td>
                  <td style={{ padding: '12px', color: colors.textSecondary, whiteSpace: 'nowrap' }}>{restaLabel}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => setEditing(m)}
                        style={{ padding: '4px 14px', borderRadius: 6, border: `1px solid ${colors.grayLight}`, background: 'transparent', color: colors.white, cursor: 'pointer', fontSize: 13 }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleRestock(m)}
                        disabled={restockPending && restockingId === m.id}
                        title={`+${m.cant} unidades`}
                        style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #22c55e55', background: '#22c55e11', color: '#22c55e', cursor: restockPending && restockingId === m.id ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: restockPending && restockingId === m.id ? 0.6 : 1 }}
                      >
                        {restockPending && restockingId === m.id ? '…' : `+${m.cant}`}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: colors.textMuted }}>
                  {search || statusFilter !== 'todos' ? 'Sin resultados' : 'Sin materiales registrados'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <StockModal material={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}
