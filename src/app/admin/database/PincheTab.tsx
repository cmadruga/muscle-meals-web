'use client'

import { useState, useTransition } from 'react'
import type { PincheVessel } from '@/lib/types'
import { colors } from '@/lib/theme'
import {
  createVessel,
  updateVessel,
  deleteVessel,
  type VesselFormData,
} from '@/app/actions/pinche-vessels'

// ─── Modal ────────────────────────────────────────────────────────────────────

function VesselModal({ vessel, onClose }: { vessel: PincheVessel | null; onClose: () => void }) {
  const [form, setForm] = useState<VesselFormData>(
    vessel ? { name: vessel.name, peso_gr: vessel.peso_gr } : { name: '', peso_gr: 0 }
  )
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function handleSubmit() {
    setError('')
    startTransition(async () => {
      const result = vessel
        ? await updateVessel(vessel.id, form)
        : await createVessel(form)
      if (result.error) setError(result.error)
      else onClose()
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
    <div style={{
      position: 'fixed', inset: 0, background: '#000000bb', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: colors.grayDark, borderRadius: 12, padding: 28,
        width: '100%', maxWidth: 380, border: `1px solid ${colors.grayLight}`,
      }}>
        <h3 style={{ color: colors.white, fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
          {vessel ? 'Editar recipiente' : 'Nuevo recipiente'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Nombre</label>
            <input
              style={inputStyle}
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej. Sartén grande"
            />
          </div>
          <div>
            <label style={labelStyle}>Peso (gr)</label>
            <input
              style={inputStyle}
              type="number"
              min={0}
              step={1}
              value={form.peso_gr}
              onChange={(e) => setForm(f => ({ ...f, peso_gr: parseFloat(e.target.value) || 0 }))}
            />
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function PincheTab({ vessels }: { vessels: PincheVessel[] }) {
  const [modal, setModal] = useState<PincheVessel | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deletePending, startDelete] = useTransition()

  function openNew() { setModal(null); setShowModal(true) }
  function openEdit(v: PincheVessel) { setModal(v); setShowModal(true) }
  function closeModal() { setShowModal(false) }

  function handleDelete(v: PincheVessel) {
    setDeleteError('')
    if (!confirm(`¿Borrar "${v.name}"?`)) return
    startDelete(async () => {
      const result = await deleteVessel(v.id)
      if (result.error) setDeleteError(result.error)
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <p style={{ flex: 1, color: colors.textMuted, fontSize: 13, margin: 0 }}>
          Recipientes usados en la vista Pinche. Su peso se resta al cocido ingresado.
        </p>
        <button
          onClick={openNew}
          style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: colors.orange, color: colors.white, cursor: 'pointer', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          + Nuevo
        </button>
      </div>

      {deleteError && (
        <div style={{ background: '#ef444422', border: '1px solid #ef444455', borderRadius: 8, padding: '10px 14px', color: colors.error, fontSize: 13, marginBottom: 16 }}>
          {deleteError}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
              {['Nombre', 'Peso (gr)', ''].map((h) => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: colors.textMuted, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vessels.map((v) => (
              <tr key={v.id} style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
                <td style={{ padding: '12px', color: colors.white, fontWeight: 500 }}>{v.name}</td>
                <td style={{ padding: '12px', color: colors.textSecondary, fontWeight: 600 }}>{v.peso_gr} gr</td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => openEdit(v)}
                      style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${colors.grayLight}`, background: 'transparent', color: colors.white, cursor: 'pointer', fontSize: 13 }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(v)}
                      disabled={deletePending}
                      style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #ef444455', background: '#ef444411', color: colors.error, cursor: deletePending ? 'not-allowed' : 'pointer', fontSize: 13 }}
                    >
                      Borrar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {vessels.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: 32, textAlign: 'center', color: colors.textMuted }}>
                  Sin recipientes registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <VesselModal vessel={modal} onClose={closeModal} />
      )}
    </div>
  )
}
