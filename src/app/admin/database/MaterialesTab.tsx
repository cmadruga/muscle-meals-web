'use client'

import { useState, useTransition, useEffect } from 'react'
import type { Material } from '@/lib/types'
import { colors } from '@/lib/theme'
import {
  createMaterial,
  updateMaterial,
  deleteMaterial,
  type MaterialFormData,
} from '@/app/actions/materials'

// ─── Modal ────────────────────────────────────────────────────────────────────

const emptyForm = (): MaterialFormData => ({
  name: '',
  cant: 0,
  cant_actual: 0,
  precio: 0,
  stock_minimo: 0,
  resta_tipo: 'orden',
  resta_cant: 1,
  proveedor: null,
})

function toForm(m: Material): MaterialFormData {
  return {
    name: m.name,
    cant: m.cant,
    cant_actual: m.cant_actual,
    precio: m.precio,
    stock_minimo: m.stock_minimo,
    resta_tipo: m.resta_tipo,
    resta_cant: m.resta_cant,
    proveedor: m.proveedor,
  }
}

interface ModalProps {
  material: Material | null
  onClose: () => void
}

function MaterialModal({ material, onClose }: ModalProps) {
  const [form, setForm] = useState<MaterialFormData>(
    material ? toForm(material) : emptyForm()
  )
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function set<K extends keyof MaterialFormData>(key: K, value: MaterialFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const precioUnd = form.cant > 0 ? (form.precio / form.cant).toFixed(2) : '0.00'

  function handleSubmit() {
    setError('')
    startTransition(async () => {
      const result = material
        ? await updateMaterial(material.id, form)
        : await createMaterial(form)
      if (result.error) {
        setError(result.error)
      } else {
        onClose()
      }
    })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: colors.grayDark,
    border: `1px solid ${colors.grayLight}`,
    borderRadius: 8,
    padding: '8px 12px',
    color: colors.white,
    fontSize: 14,
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
    display: 'block',
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: '#000000bb', zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{
        background: colors.grayDark, borderRadius: 12, padding: 28,
        width: '100%', maxWidth: 480, border: `1px solid ${colors.grayLight}`,
      }}>
        <h3 style={{ color: colors.white, fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
          {material ? 'Editar material' : 'Nuevo material'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Nombre */}
          <div>
            <label style={labelStyle}>Nombre</label>
            <input
              style={inputStyle}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ej. Tupper 1L"
            />
          </div>

          {/* Cant empaque + Stock actual + Precio */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Cant. empaque</label>
              <input
                style={inputStyle}
                type="number"
                min={0}
                value={form.cant}
                onChange={(e) => set('cant', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label style={labelStyle}>Stock actual</label>
              <input
                style={inputStyle}
                type="number"
                min={0}
                value={form.cant_actual}
                onChange={(e) => set('cant_actual', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label style={labelStyle}>Precio compra</label>
              <input
                style={inputStyle}
                type="number"
                min={0}
                step={0.01}
                value={form.precio}
                onChange={(e) => set('precio', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Precio/und hint */}
          <p style={{ color: colors.textMuted, fontSize: 12, margin: '-8px 0 0' }}>
            Precio/und: <span style={{ color: colors.textSecondary, fontWeight: 600 }}>${precioUnd}</span>
          </p>

          {/* Stock mínimo */}
          <div>
            <label style={labelStyle}>Stock mínimo</label>
            <input
              style={inputStyle}
              type="number"
              min={0}
              value={form.stock_minimo}
              onChange={(e) => set('stock_minimo', parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Proveedor */}
          <div>
            <label style={labelStyle}>Proveedor</label>
            <input style={inputStyle} value={form.proveedor ?? ''} onChange={(e) => set('proveedor', e.target.value || null)} placeholder="Opcional" />
          </div>

          {/* Resta tipo + cant */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Tipo de resta</label>
              <select
                style={inputStyle}
                value={form.resta_tipo}
                onChange={(e) => set('resta_tipo', e.target.value as 'orden' | 'fija')}
              >
                <option value="orden">Por orden</option>
                <option value="fija">Fija semanal</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>
                {form.resta_tipo === 'orden' ? 'Cant. por ítem' : 'Cant. por semana'}
              </label>
              <input
                style={inputStyle}
                type="number"
                min={0}
                step={1}
                value={form.resta_cant}
                onChange={(e) => set('resta_cant', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        {error && (
          <p style={{ color: colors.error, fontSize: 13, marginTop: 16 }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${colors.grayLight}`, background: 'transparent', color: colors.textMuted, cursor: 'pointer', fontSize: 14 }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={pending || !form.name.trim()}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: colors.orange, color: colors.white, cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: pending ? 0.7 : 1 }}
          >
            {pending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function MaterialesTab({ materials }: { materials: Material[] }) {
  const [modal, setModal] = useState<Material | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deletePending, startDelete] = useTransition()

  function openNew() { setModal(null); setShowModal(true) }
  function openEdit(m: Material) { setModal(m); setShowModal(true) }
  function closeModal() { setShowModal(false) }

  function handleDelete(m: Material) {
    setDeleteError('')
    if (!confirm(`¿Borrar "${m.name}"?`)) return
    startDelete(async () => {
      const result = await deleteMaterial(m.id)
      if (result.error) setDeleteError(result.error)
    })
  }

  const filtered = materials.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar material…"
          style={{ flex: 1, minWidth: 160, background: colors.grayDark, border: `1px solid ${colors.grayLight}`, borderRadius: 8, padding: '7px 12px', color: colors.white, fontSize: 14 }}
        />
        <button
          onClick={openNew}
          style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: colors.orange, color: colors.white, cursor: 'pointer', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          + Nuevo material
        </button>
      </div>

      {deleteError && (
        <div style={{ background: '#ef444422', border: '1px solid #ef444455', borderRadius: 8, padding: '10px 14px', color: colors.error, fontSize: 13, marginBottom: 16 }}>
          {deleteError}
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
              {['Nombre', 'Cant pedido', 'Precio', '$/und', 'Stock actual', 'Stock mín.', 'Proveedor', 'Resta', ''].map((h) => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: colors.textMuted, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => {
              const restaLabel = m.resta_tipo === 'orden'
                ? `Por orden ×${m.resta_cant}`
                : `${m.resta_cant} / sem`

              return (
                <tr key={m.id} style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
                  <td style={{ padding: '12px', color: colors.white, fontWeight: 500 }}>{m.name}</td>
                  <td style={{ padding: '12px', color: colors.white, fontWeight: 600 }}>{m.cant}</td>
                  <td style={{ padding: '12px', color: colors.textSecondary }}>${m.precio.toFixed(2)}</td>
                  <td style={{ padding: '12px', color: colors.textSecondary }}>${m.precio_por_unidad.toFixed(4)}</td>
                  <td style={{ padding: '12px', color: colors.textSecondary }}>{m.cant_actual}</td>
                  <td style={{ padding: '12px', color: colors.textSecondary }}>{m.stock_minimo}</td>
                  <td style={{ padding: '12px', color: colors.textMuted, fontSize: 13 }}>{m.proveedor ?? '—'}</td>
                  <td style={{ padding: '12px', color: colors.textSecondary, whiteSpace: 'nowrap' }}>{restaLabel}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => openEdit(m)}
                        style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${colors.grayLight}`, background: 'transparent', color: colors.white, cursor: 'pointer', fontSize: 13 }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(m)}
                        disabled={deletePending}
                        style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #ef444455', background: '#ef444411', color: colors.error, cursor: deletePending ? 'not-allowed' : 'pointer', fontSize: 13 }}
                      >
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: 32, textAlign: 'center', color: colors.textMuted }}>
                  {search ? 'Sin resultados' : 'Sin materiales registrados'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <MaterialModal material={modal} onClose={closeModal} />
      )}
    </div>
  )
}
