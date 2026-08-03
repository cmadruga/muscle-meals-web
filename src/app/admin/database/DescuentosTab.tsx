'use client'

import { useState, useTransition, useEffect } from 'react'
import { colors } from '@/lib/theme'
import type { Discount, DiscountType, DiscountCondition } from '@/lib/types/discount'
import {
  createDiscount,
  updateDiscount,
  toggleDiscount,
  deleteDiscount,
  type DiscountFormData,
} from '@/app/actions/discounts'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

function typeLabel(d: Discount) {
  if (d.type === 'percent') return `${d.value}% off`
  if (d.type === 'fixed') return `-$${(d.value / 100).toFixed(0)}`
  return 'Envío gratis'
}

function conditionLabel(d: Discount) {
  if (d.condition_type === 'first_order') return 'Primer pedido'
  if (d.condition_type === 'streak') return `Cada ${d.condition_value ?? '?'} pedidos`
  if (d.condition_type === 'cumulative_orders') return `Recurrente ${d.condition_value ?? '?'} sem.`
  return 'Siempre'
}

// ─── Condition options ────────────────────────────────────────────────────────

const CONDITIONS: { value: DiscountCondition; label: string; desc: string; needsN?: boolean; nLabel?: string }[] = [
  { value: 'always',            label: 'Siempre',            desc: 'Aplica en cualquier pedido' },
  { value: 'first_order',       label: 'Primer pedido',      desc: 'El cliente no ha hecho pedidos previos' },
  { value: 'streak',            label: 'Cada N pedidos',     desc: 'En el 5°, 10°, 15°... pedido del cliente', needsN: true, nLabel: 'Cada cuántos pedidos' },
  { value: 'cumulative_orders', label: 'Cliente recurrente', desc: 'N semanas seguidas pidiendo — se reinicia si faltan una semana', needsN: true, nLabel: 'Aplica a partir del pedido:' },
]

// ─── Form types ───────────────────────────────────────────────────────────────

type Step1 = {
  name: string
  code: string
  type: DiscountType
  value: string
  condition_type: DiscountCondition
  condition_value: string
  min_items: string
  min_amount: string   // pesos
  max_uses: string
}

type ActiveMode = 'active' | 'scheduled' | 'inactive'

type Step2 = {
  activeMode: ActiveMode
  starts_at: string
  hasExpiry: boolean
  expires_at: string
}

const emptyStep1 = (): Step1 => ({
  name: '', code: '', type: 'percent', value: '10',
  condition_type: 'always', condition_value: '',
  min_items: '', min_amount: '', max_uses: '',
})

const emptyStep2 = (): Step2 => ({ activeMode: 'active', starts_at: '', hasExpiry: false, expires_at: '' })

function discountToStep1(d: Discount): Step1 {
  return {
    name: d.name,
    code: d.code ?? '',
    type: d.type,
    value: d.type === 'fixed' ? String(d.value / 100) : String(d.value),
    condition_type: d.condition_type,
    condition_value: d.condition_value != null ? String(d.condition_value) : '',
    min_items: d.min_items != null ? String(d.min_items) : '',
    min_amount: d.min_amount != null ? String(d.min_amount / 100) : '',
    max_uses: d.max_uses != null ? String(d.max_uses) : '',
  }
}

function discountToStep2(d: Discount): Step2 {
  const now = new Date()
  let activeMode: ActiveMode = 'inactive'
  if (d.active) {
    activeMode = d.starts_at && new Date(d.starts_at) > now ? 'scheduled' : 'active'
  }
  return {
    activeMode,
    starts_at: d.starts_at ? d.starts_at.split('T')[0] : '',
    hasExpiry: !!d.expires_at,
    expires_at: d.expires_at ? d.expires_at.split('T')[0] : '',
  }
}

function buildFormData(s1: Step1, s2: Step2): DiscountFormData {
  const valueNum = parseFloat(s1.value) || 0
  const condNeedsN = s1.condition_type === 'streak' || s1.condition_type === 'cumulative_orders'
  const isCode = s1.code.trim().length > 0
  return {
    name: s1.name.trim(),
    code: isCode ? s1.code.toUpperCase().trim() : null,
    type: s1.type,
    value: s1.type === 'fixed' ? Math.round(valueNum * 100) : s1.type === 'free_shipping' ? 0 : valueNum,
    condition_type: s1.condition_type,
    condition_value: condNeedsN ? (parseInt(s1.condition_value) || null) : null,
    min_items: s1.min_items ? (parseInt(s1.min_items) || null) : null,
    min_amount: s1.min_amount ? Math.round((parseFloat(s1.min_amount) || 0) * 100) : null,
    valid_days: null,
    max_uses: s1.condition_type === 'first_order' ? null : (s1.max_uses ? parseInt(s1.max_uses) || null : null),
    max_uses_per_customer: isCode ? 1 : null,
    active: s2.activeMode !== 'inactive',
    starts_at: s2.activeMode === 'scheduled' && s2.starts_at
      ? new Date(s2.starts_at + 'T00:00:00').toISOString() : null,
    expires_at: s2.hasExpiry && s2.expires_at
      ? new Date(s2.expires_at + 'T23:59:59').toISOString() : null,
  }
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: '100%', background: colors.grayDark, border: `1px solid ${colors.grayLight}`,
  borderRadius: 8, padding: '8px 12px', color: colors.white, fontSize: 14, boxSizing: 'border-box',
}
const lbl: React.CSSProperties = { color: colors.textMuted, fontSize: 12, marginBottom: 4, display: 'block' }

// ─── Modal ────────────────────────────────────────────────────────────────────

function DiscountModal({ discount, onClose }: { discount: Discount | null; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [s1, setS1] = useState<Step1>(discount ? discountToStep1(discount) : emptyStep1())
  const [s2, setS2] = useState<Step2>(discount ? discountToStep2(discount) : emptyStep2())
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function set1<K extends keyof Step1>(k: K, v: Step1[K]) { setS1(f => ({ ...f, [k]: v })) }
  function set2<K extends keyof Step2>(k: K, v: Step2[K]) { setS2(f => ({ ...f, [k]: v })) }

  function validateStep1() {
    if (!s1.name.trim()) return 'El nombre es requerido'
    if (s1.type !== 'free_shipping' && (!s1.value || parseFloat(s1.value) <= 0)) return 'El valor del descuento es requerido'
    if ((s1.condition_type === 'streak' || s1.condition_type === 'cumulative_orders') && !parseInt(s1.condition_value)) return 'Indica el número N de pedidos'
    return null
  }

  function validateStep2() {
    if (s2.activeMode === 'scheduled' && !s2.starts_at) return 'Indica la fecha de activación'
    if (s2.hasExpiry && !s2.expires_at) return 'Indica la fecha de expiración'
    return null
  }

  function handleNextStep() {
    const err = validateStep1()
    if (err) { setError(err); return }
    setError('')
    setStep(2)
  }

  function handleSubmit() {
    const err = validateStep2()
    if (err) { setError(err); return }
    setError('')
    startTransition(async () => {
      const data = buildFormData(s1, s2)
      const result = discount ? await updateDiscount(discount.id, data) : await createDiscount(data)
      if (result.error) { setError(result.error); return }
      onClose()
    })
  }

  const selectedCond = CONDITIONS.find(c => c.value === s1.condition_type)!

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: '#000000bb', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: colors.grayDark, borderRadius: 12, padding: 28, width: '100%', maxWidth: 520, border: `1px solid ${colors.grayLight}`, maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 style={{ color: colors.white, fontSize: 18, fontWeight: 700, margin: 0 }}>
            {discount ? 'Editar descuento' : 'Nuevo descuento'}
          </h3>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {([1, 2] as const).map(n => (
              <div key={n} style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: step === n ? colors.orange : step > n ? `${colors.orange}40` : '#333', color: step >= n ? '#fff' : '#666' }}>
                {n}
              </div>
            ))}
          </div>
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Nombre */}
            <div>
              <label style={lbl}>Nombre interno</label>
              <input style={inp} value={s1.name} onChange={e => set1('name', e.target.value)} placeholder="Ej. Primer pedido 10%" />
            </div>

            {/* Código */}
            <div>
              <label style={lbl}>Código promo <span style={{ color: '#555' }}>(dejar vacío = se activa automático sin codigo si aplica)</span></label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ ...inp, textTransform: 'uppercase', flex: 1 }}
                  value={s1.code}
                  onChange={e => set1('code', e.target.value.toUpperCase())}
                  placeholder="Ej. VERANO20"
                />
                <button
                  onClick={() => set1('code', randomCode())}
                  style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${colors.grayLight}`, background: 'transparent', color: colors.textMuted, cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}
                >
                  Generar
                </button>
              </div>
            </div>

            {/* Tipo + valor */}
            <div>
              <label style={lbl}>Tipo de descuento</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {([['percent', '% Porcentaje'], ['fixed', '$ Monto fijo'], ['free_shipping', 'Envío gratis']] as [DiscountType, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => set1('type', val)}
                    style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: `1px solid ${s1.type === val ? colors.orange : colors.grayLight}`, background: s1.type === val ? `${colors.orange}22` : 'transparent', color: s1.type === val ? colors.orange : colors.textMuted, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {s1.type !== 'free_shipping' && (
                <input
                  style={inp}
                  type="number"
                  min={0}
                  step={s1.type === 'percent' ? 1 : 0.01}
                  value={s1.value}
                  onChange={e => set1('value', e.target.value)}
                  placeholder={s1.type === 'percent' ? 'Ej. 10  →  10% de descuento' : 'Ej. 50  →  $50 de descuento'}
                />
              )}
            </div>

            {/* Condición */}
            <div>
              <label style={lbl}>¿Cuándo aplica?</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {CONDITIONS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => { set1('condition_type', c.value); set1('condition_value', '') }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, border: `1px solid ${s1.condition_type === c.value ? colors.orange : colors.grayLight}`, background: s1.condition_type === c.value ? `${colors.orange}12` : 'transparent', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${s1.condition_type === c.value ? colors.orange : '#555'}`, background: s1.condition_type === c.value ? colors.orange : 'transparent', flexShrink: 0 }} />
                    <div>
                      <div style={{ color: colors.white, fontSize: 14, fontWeight: 600 }}>{c.label}</div>
                      <div style={{ color: colors.textMuted, fontSize: 12 }}>{c.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              {selectedCond.needsN && (
                <div style={{ marginTop: 10 }}>
                  <label style={lbl}>{selectedCond.nLabel}</label>
                  <input style={inp} type="number" min={1} value={s1.condition_value} onChange={e => set1('condition_value', e.target.value)} placeholder="Ej. 5" />
                </div>
              )}
            </div>

            {/* Requisitos mínimos */}
            <div style={{ display: 'grid', gap: 10 }}>
              <label style={{ ...lbl, marginBottom: 8 }}>Requisitos mínimos <span style={{ color: '#555' }}>(opcionales)</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl}>Mínimo de platillos</label>
                  <input style={inp} type="number" min={0} value={s1.min_items} onChange={e => set1('min_items', e.target.value)} placeholder="Sin mínimo" />
                </div>
                <div>
                  <label style={lbl}>Mínimo de compra ($)</label>
                  <input style={inp} type="number" min={0} value={s1.min_amount} onChange={e => set1('min_amount', e.target.value)} placeholder="Sin mínimo" />
                </div>
              </div>

              {/* Límite de usos — oculto para primer pedido */}
              {s1.condition_type !== 'first_order' && (
                <div>
                  <label style={lbl}>Límite de usos totales por cliente</label>
                  <input style={inp} type="number" min={0} value={s1.max_uses} onChange={e => set1('max_uses', e.target.value)} placeholder="Ilimitado" />
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Resumen */}
            <div style={{ padding: '12px 16px', background: `${colors.orange}10`, border: `1px solid ${colors.orange}30`, borderRadius: 8 }}>
              <div style={{ color: colors.textMuted, fontSize: 12 }}>Descuento a guardar</div>
              <div style={{ color: colors.white, fontWeight: 700, marginTop: 2 }}>{s1.name}</div>
              <div style={{ color: colors.orange, fontSize: 13, marginTop: 2 }}>
                {s1.type === 'percent' ? `${s1.value}% off` : s1.type === 'fixed' ? `-$${s1.value}` : 'Envío gratis'}
                {s1.code && <> · <span style={{ fontFamily: 'monospace' }}>{s1.code.toUpperCase()}</span></>}
              </div>
            </div>

            {/* Activación */}
            <div>
              <label style={{ ...lbl, marginBottom: 10 }}>¿Activar ahora?</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {([['active', 'Sí'], ['scheduled', 'Programar'], ['inactive', 'Inactivo']] as [ActiveMode, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => set2('activeMode', val)}
                    style={{ flex: 1, padding: '10px 6px', borderRadius: 8, border: `1px solid ${s2.activeMode === val ? colors.orange : colors.grayLight}`, background: s2.activeMode === val ? `${colors.orange}20` : 'transparent', color: s2.activeMode === val ? colors.orange : colors.textMuted, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fecha de activación — solo si programar */}
            {s2.activeMode === 'scheduled' && (
              <div>
                <label style={lbl}>Fecha de activación</label>
                <input style={inp} type="date" value={s2.starts_at} onChange={e => set2('starts_at', e.target.value)} />
              </div>
            )}

            {/* Expiración */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: s2.hasExpiry ? 10 : 0 }}>
                <span style={{ color: colors.textMuted, fontSize: 14 }}>Expira</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {([true, false] as const).map(val => (
                    <button
                      key={String(val)}
                      onClick={() => { set2('hasExpiry', val); if (!val) set2('expires_at', '') }}
                      style={{ padding: '4px 14px', borderRadius: 20, border: `1px solid ${s2.hasExpiry === val ? colors.orange : colors.grayLight}`, background: s2.hasExpiry === val ? `${colors.orange}20` : 'transparent', color: s2.hasExpiry === val ? colors.orange : colors.textMuted, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                    >
                      {val ? 'Sí' : 'No'}
                    </button>
                  ))}
                </div>
              </div>
              {s2.hasExpiry && (
                <input style={inp} type="date" value={s2.expires_at} onChange={e => set2('expires_at', e.target.value)} />
              )}
            </div>
          </div>
        )}

        {error && <p style={{ color: colors.error, fontSize: 13, marginTop: 16 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
          {step === 1 ? (
            <>
              <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid ${colors.grayLight}`, background: 'transparent', color: colors.textMuted, cursor: 'pointer', fontSize: 14 }}>
                Cancelar
              </button>
              <button onClick={handleNextStep} style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: colors.orange, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                Continuar →
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setStep(1); setError('') }} style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid ${colors.grayLight}`, background: 'transparent', color: colors.textMuted, cursor: 'pointer', fontSize: 14 }}>
                ← Atrás
              </button>
              <button onClick={handleSubmit} disabled={pending} style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: colors.orange, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: pending ? 0.7 : 1 }}>
                {pending ? 'Guardando…' : 'Guardar descuento'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DescuentosTab({ discounts }: { discounts: Discount[] }) {
  const [editing, setEditing] = useState<Discount | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [togglePending, startToggle] = useTransition()
  const [deletePending, startDelete] = useTransition()
  const [actionError, setActionError] = useState('')

  function openNew() { setEditing(null); setShowModal(true) }
  function openEdit(d: Discount) { setEditing(d); setShowModal(true) }
  function closeModal() { setShowModal(false) }

  function handleToggle(d: Discount) {
    setActionError('')
    startToggle(async () => {
      const result = await toggleDiscount(d.id, !d.active)
      if (result.error) setActionError(result.error)
    })
  }

  function handleDelete(d: Discount) {
    if (!confirm(`¿Borrar "${d.name}"?`)) return
    setActionError('')
    startDelete(async () => {
      const result = await deleteDiscount(d.id)
      if (result.error) setActionError(result.error)
    })
  }

  const now = new Date()

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <p style={{ flex: 1, color: colors.textMuted, fontSize: 13, margin: 0 }}>
          {discounts.length === 0 ? 'Sin descuentos configurados' : `${discounts.length} descuento${discounts.length !== 1 ? 's' : ''}`}
        </p>
        <button onClick={openNew} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: colors.orange, color: colors.white, cursor: 'pointer', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>
          + Nuevo descuento
        </button>
      </div>

      {actionError && (
        <div style={{ background: '#ef444422', border: '1px solid #ef444455', borderRadius: 8, padding: '10px 14px', color: colors.error, fontSize: 13, marginBottom: 16 }}>
          {actionError}
        </div>
      )}

      {discounts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: colors.textMuted }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>%</div>
          <p>Crea tu primer descuento</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
                {['Nombre / Código', 'Descuento', 'Condición', 'Usos', 'Estado', ''].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: colors.textMuted, fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {discounts.map(d => {
                const isExpired = d.expires_at && new Date(d.expires_at) < now
                const isScheduled = d.active && d.starts_at && new Date(d.starts_at) > now
                return (
                  <tr key={d.id} style={{ borderBottom: `1px solid ${colors.grayLight}`, opacity: d.active && !isExpired ? 1 : 0.5 }}>
                    <td style={{ padding: '12px', color: colors.white }}>
                      <div style={{ fontWeight: 600 }}>{d.name}</div>
                      {d.code
                        ? <div style={{ fontSize: 12, color: colors.orange, fontFamily: 'monospace', marginTop: 2 }}>{d.code}</div>
                        : <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>automático</div>
                      }
                      {isExpired && <div style={{ fontSize: 11, color: colors.error, marginTop: 2 }}>Expirado</div>}
                      {isScheduled && <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 2 }}>Activa {new Date(d.starts_at!).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</div>}
                      {d.expires_at && !isExpired && !isScheduled && <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>Vence {new Date(d.expires_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</div>}
                    </td>
                    <td style={{ padding: '12px', color: colors.orange, fontWeight: 700 }}>{typeLabel(d)}</td>
                    <td style={{ padding: '12px', color: colors.textSecondary, fontSize: 13 }}>
                      {conditionLabel(d)}
                      {d.min_items && <div style={{ fontSize: 11, color: colors.textMuted }}>≥{d.min_items} platos</div>}
                      {d.min_amount && <div style={{ fontSize: 11, color: colors.textMuted }}>≥${(d.min_amount / 100).toFixed(0)} MXN</div>}
                    </td>
                    <td style={{ padding: '12px', color: colors.textSecondary }}>{d.total_uses}{d.max_uses ? `/${d.max_uses}` : ''}</td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => handleToggle(d)}
                        disabled={togglePending}
                        style={{ padding: '3px 10px', borderRadius: 20, border: `1px solid ${d.active && !isExpired ? (isScheduled ? '#f59e0b' : '#10b981') : colors.grayLight}`, background: d.active && !isExpired ? (isScheduled ? '#f59e0b22' : '#10b98122') : 'transparent', color: d.active && !isExpired ? (isScheduled ? '#f59e0b' : '#10b981') : colors.textMuted, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                      >
                        {!d.active || isExpired ? 'Inactivo' : isScheduled ? 'Programado' : 'Activo'}
                      </button>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(d)} style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${colors.grayLight}`, background: 'transparent', color: colors.white, cursor: 'pointer', fontSize: 13 }}>
                          Editar
                        </button>
                        <button onClick={() => handleDelete(d)} disabled={deletePending} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #ef444455', background: '#ef444411', color: colors.error, cursor: 'pointer', fontSize: 13 }}>
                          Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <DiscountModal discount={editing} onClose={closeModal} />}
    </div>
  )
}
