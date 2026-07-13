'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { colors } from '@/lib/theme'
import { sendReorderBroadcast, listTemplateImages, uploadTemplateImage } from '@/app/actions/whatsapp'
import { updateMembership, updateCustomerContact } from '@/app/actions/membership'
import type { CustomerRow, CustomerOrder, SizeOption } from './page'

const STATUS_LABELS: Record<string, string> = {
  creado: 'Creado', pending: 'Pendiente', paid: 'Pagado',
  cancelled: 'Cancelado', extra: 'Extra', admin: 'Admin',
}
const STATUS_COLORS: Record<string, string> = {
  creado: '#94a3b8', pending: '#f59e0b', paid: '#10b981',
  cancelled: '#ef4444', extra: '#a855f7', admin: '#06b6d4',
}

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtAmt(cents: number) {
  return `$${(cents / 100).toFixed(0)} MXN`
}
function lastOrderTs(c: CustomerRow): number {
  return c.orders[0] ? new Date(c.orders[0].created_at).getTime() : new Date(c.created_at).getTime()
}

// ─── Membership Modal ────────────────────────────────────────────────────────

function MembershipModal({ customer, sizes, onClose, onSaved }: {
  customer: CustomerRow
  sizes: SizeOption[]
  onClose: () => void
  onSaved: () => void
}) {
  const [isMember, setIsMember] = useState(customer.is_member)
  const [weeksLeft, setWeeksLeft] = useState(customer.membership_weeks_left)
  const [qty, setQty] = useState(customer.membership_qty ?? 5)
  const [sizeId, setSizeId] = useState(customer.membership_size_id ?? '')
  const [fullName, setFullName] = useState(customer.full_name ?? '')
  const [phone, setPhone] = useState(customer.phone ?? '')
  const [address, setAddress] = useState(customer.address ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await Promise.all([
        updateMembership(customer.id, {
          is_member: isMember,
          membership_weeks_left: isMember ? weeksLeft : 0,
          membership_qty: isMember ? qty : null,
          membership_size_id: isMember && sizeId ? sizeId : null,
        }),
        updateCustomerContact(customer.id, {
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
        }),
      ])
      onClose()
      onSaved()
    } catch {
      setError('Error al guardar — intenta de nuevo')
      setSaving(false)
    }
  }

  const field = (label: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, color: colors.textMuted, display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px',
    background: colors.black, border: `1px solid ${colors.grayLight}`,
    borderRadius: 7, color: colors.white, fontSize: 14, boxSizing: 'border-box',
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
    >
      <div style={{ background: colors.grayDark, border: `1px solid ${colors.grayLight}`, borderRadius: 12, width: '100%', maxWidth: 360, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.white }}>Membresía</div>
            <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{customer.full_name}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
        </div>

        {/* Contacto */}
        {field('Nombre completo',
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nombre Apellido" style={inputStyle} />
        )}
        {field('Teléfono (formato libre, ej: +12103508243)',
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+521..." style={inputStyle} />
        )}
        {field('Dirección',
          <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} placeholder="Calle, núm, colonia..." style={{ ...inputStyle, resize: 'vertical' }} />
        )}

        <div style={{ height: 1, background: '#ffffff15', margin: '4px 0 16px' }} />

        {/* Toggle membresía */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 14, color: colors.white, fontWeight: 600 }}>Membresía activa</span>
          <div
            onClick={() => setIsMember(v => !v)}
            style={{
              width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
              background: isMember ? colors.orange : colors.grayLight,
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute', top: 3, left: isMember ? 23 : 3,
              width: 18, height: 18, borderRadius: '50%', background: colors.white,
              transition: 'left 0.2s',
            }} />
          </div>
        </div>

        {isMember && (
          <>
            {field('Semanas restantes',
              <input type="number" min={0} value={weeksLeft} onChange={e => setWeeksLeft(Number(e.target.value))} style={inputStyle} />
            )}
            {field('Platillos por semana',
              <input type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value))} style={inputStyle} />
            )}
            {field('Tamaño',
              <select value={sizeId} onChange={e => setSizeId(e.target.value)} style={inputStyle}>
                <option value="">— Sin especificar —</option>
                {sizes
                  .filter(s => (s.customer_id === null && s.is_main) || s.customer_id === customer.id)
                  .map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.customer_id === customer.id ? ' (personalizado)' : ''}
                    </option>
                  ))
                }
              </select>
            )}
          </>
        )}

        {error && <div style={{ color: colors.error, fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <button
          onClick={handleSave} disabled={saving}
          style={{ width: '100%', padding: 11, background: colors.orange, color: colors.white, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

// ─── Order Detail ─────────────────────────────────────────────────────────────

function OrderDetail({ items, total }: { items: CustomerOrder['items']; total: number }) {
  const packages = new Map<string, typeof items>()
  const individuals: typeof items = []
  for (const i of items) {
    if (i.package_instance_id) {
      const g = packages.get(i.package_instance_id) ?? []
      g.push(i)
      packages.set(i.package_instance_id, g)
    } else {
      individuals.push(i)
    }
  }

  return (
    <div style={{ background: colors.black, borderTop: `1px solid ${colors.grayLight}33`, padding: '12px 20px 14px' }}>
      {[...packages.values()].map((grp, idx) => (
        <div key={idx} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: colors.orange, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Paquete · ×{grp.reduce((s, i) => s + i.qty, 0)}
          </div>
          {grp.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0 5px 12px', borderBottom: i < grp.length - 1 ? `1px solid ${colors.grayLight}22` : 'none' }}>
              <div>
                <span style={{ fontSize: 13, color: colors.white }}>{item.meal_name}</span>
                <span style={{ fontSize: 11, color: colors.textMuted, marginLeft: 8 }}>{item.size_name}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: colors.textMuted }}>×{item.qty}</span>
                <span style={{ fontSize: 12, color: colors.white, minWidth: 60, textAlign: 'right' }}>{fmtAmt(item.unit_price * item.qty)}</span>
              </div>
            </div>
          ))}
        </div>
      ))}
      {individuals.map((item, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: i < individuals.length - 1 ? `1px solid ${colors.grayLight}22` : 'none' }}>
          <div>
            <span style={{ fontSize: 13, color: colors.white }}>{item.meal_name}</span>
            <span style={{ fontSize: 11, color: colors.textMuted, marginLeft: 8 }}>{item.size_name}</span>
          </div>
          <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: colors.textMuted }}>×{item.qty}</span>
            <span style={{ fontSize: 12, color: colors.white, minWidth: 60, textAlign: 'right' }}>{fmtAmt(item.unit_price * item.qty)}</span>
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: `1px solid ${colors.grayLight}44` }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: colors.orange }}>Total: {fmtAmt(total)}</span>
      </div>
    </div>
  )
}

// ─── Order Row ────────────────────────────────────────────────────────────────

function OrderRow({ order, openOrder, setOpenOrder }: {
  order: CustomerOrder
  openOrder: string | null
  setOpenOrder: (id: string | null) => void
}) {
  const isOpen = openOrder === order.id
  const sc = STATUS_COLORS[order.status] ?? colors.textMuted
  return (
    <div style={{ background: colors.grayDark, borderRadius: 10, overflow: 'hidden', border: `1px solid ${isOpen ? colors.orange + '55' : colors.grayLight}` }}>
      <div onClick={() => setOpenOrder(isOpen ? null : order.id)} style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', cursor: 'pointer' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: colors.white, minWidth: 80 }}>{order.order_number}</span>
        <span style={{ fontSize: 12, color: colors.textMuted }}>{fmtDate(order.created_at)}</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: colors.white }}>{fmtAmt(order.total_amount)}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: sc, background: sc + '22', border: `1px solid ${sc}55`, borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap' }}>
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
        <span style={{ color: colors.textMuted, fontSize: 12 }}>{isOpen ? '▲' : '▼'}</span>
      </div>
      {isOpen && <OrderDetail items={order.items} total={order.total_amount} />}
    </div>
  )
}

// ─── Orders Drawer ────────────────────────────────────────────────────────────

function OrdersDrawer({ customer, onClose }: { customer: CustomerRow; onClose: () => void }) {
  const [openOrder, setOpenOrder] = useState<string | null>(null)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        width: '100%', maxWidth: 520,
        background: colors.black,
        borderLeft: `1px solid ${colors.grayLight}`,
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: `1px solid ${colors.grayLight}`,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          position: 'sticky', top: 0, background: colors.black, zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.white }}>{customer.full_name}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', marginTop: 4 }}>
              {Object.entries(
                [...customer.orders, ...customer.guestOrders].reduce<Record<string, number>>((acc, o) => {
                  acc[o.status] = (acc[o.status] ?? 0) + 1
                  return acc
                }, {})
              ).map(([status, count]) => {
                const color = STATUS_COLORS[status] ?? colors.textMuted
                return (
                  <span key={status} style={{ fontSize: 11, color, fontWeight: 600 }}>
                    {count} {STATUS_LABELS[status]?.toLowerCase() ?? status}
                  </span>
                )
              })}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 4 }}>×</button>
        </div>

        {/* Orders */}
        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {customer.orders.length === 0 && customer.guestOrders.length === 0 && (
            <p style={{ color: colors.textMuted, textAlign: 'center', padding: '32px 0' }}>Sin pedidos.</p>
          )}
          {customer.orders.map((order) => <OrderRow key={order.id} order={order} openOrder={openOrder} setOpenOrder={setOpenOrder} />)}

          {customer.guestOrders.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '8px 0 4px' }}>
                Sin cuenta · {customer.guestOrders.length} {customer.guestOrders.length === 1 ? 'pedido' : 'pedidos'}
              </div>
              {customer.guestOrders.map((order) => <OrderRow key={order.id} order={order} openOrder={openOrder} setOpenOrder={setOpenOrder} />)}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Customer Card ────────────────────────────────────────────────────────────

function CustomerCard({ customer, isHighlight, highlightRef, onConfigClick, onDetailClick }: {
  customer: CustomerRow
  isHighlight: boolean
  highlightRef: React.RefObject<HTMLDivElement | null>
  onConfigClick: () => void
  onDetailClick: () => void
}) {
  const isGuest = customer.user_id === null
  const paidOrders = customer.orders.filter(o => o.status === 'paid').length
  const guestPaid = customer.guestOrders.filter(o => o.status === 'paid').length

  return (
    <div
      ref={isHighlight ? highlightRef : null}
      style={{ background: colors.grayDark, border: `1px solid ${isHighlight ? colors.orange : colors.grayLight}`, borderRadius: 12, overflow: 'hidden' }}
    >
      <div style={{ padding: '18px 20px', display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Left: info */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.white }}>{customer.full_name}</div>
            {isGuest && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', background: '#94a3b818', border: '1px solid #94a3b844', borderRadius: 10, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                Sin cuenta
              </span>
            )}
            {!isGuest && customer.is_member && (
              <span style={{ fontSize: 11, fontWeight: 700, color: colors.orange, background: colors.orange + '18', border: `1px solid ${colors.orange}44`, borderRadius: 10, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                Miembro · {customer.membership_weeks_left} sem
              </span>
            )}
          </div>
          {!isGuest && <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>{customer.email}</div>}
          <div>
            {customer.phone ? (
              <a href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#10b981', textDecoration: 'none' }}>
                📱 {customer.phone}
              </a>
            ) : (
              <span style={{ fontSize: 13, color: colors.grayLight }}>Sin teléfono</span>
            )}
          </div>
          {customer.address
            ? <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 6, lineHeight: 1.4 }}>📍 {customer.address}</div>
            : <div style={{ fontSize: 12, color: colors.grayLight, marginTop: 6 }}>Sin dirección guardada</div>
          }
        </div>

        {/* Right: meta + buttons */}
        <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={onDetailClick}
              title="Ver pedidos"
              style={{ background: colors.grayLight, border: 'none', borderRadius: 6, color: colors.white, fontSize: 13, fontWeight: 600, padding: '5px 12px', cursor: 'pointer' }}
            >
              Pedidos
            </button>
            {!isGuest && (
              <button
                onClick={onConfigClick}
                title="Configurar membresía"
                style={{ background: colors.grayLight, border: 'none', borderRadius: 6, color: colors.white, fontSize: 25, fontWeight: 600, padding: '5px 12px', cursor: 'pointer' }}
              >
                ⚙
              </button>
            )}
          </div>
          <div style={{ fontSize: 12, color: colors.textMuted }}>
            {paidOrders + guestPaid} {(paidOrders + guestPaid) === 1 ? 'pedido' : 'pedidos'}
            {guestPaid > 0 && (
              <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 6 }}>({guestPaid} sin cuenta)</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: colors.textMuted }}>
            {isGuest ? 'Último pedido' : 'Cliente desde'} {fmtDate(customer.created_at)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── WhatsApp Modal ───────────────────────────────────────────────────────────

type TemplateImage = { name: string; url: string }

const TEMPLATES = [
  { id: 'reordenar', label: 'Reordenar', description: 'Invita al cliente a repetir su pedido', hasImage: true },
]

function WhatsAppModal({ sorted, onClose }: { sorted: CustomerRow[]; onClose: () => void }) {
  // Step 1 state
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedTemplate, setSelectedTemplate] = useState('reordenar')
  const [images, setImages] = useState<TemplateImage[]>([])
  const [imagesLoading, setImagesLoading] = useState(true)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [uploadName, setUploadName] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 2 state
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const selectAllRef = useRef<HTMLInputElement>(null)

  const [selected, setSelected] = useState<Set<string>>(() => {
    const now = Date.now()
    return new Set(
      sorted
        .filter(c => c.phone && c.orders[0] && now - new Date(c.orders[0].created_at).getTime() < TWO_WEEKS_MS)
        .map(c => c.id)
    )
  })

  // Load images on mount
  useEffect(() => {
    listTemplateImages().then(list => {
      setImages(list)
      if (list.length > 0) setSelectedImageUrl(list[0].url)
      setImagesLoading(false)
    })
  }, [])

  const currentTemplate = TEMPLATES.find(t => t.id === selectedTemplate)!

  const handleUpload = async () => {
    if (!uploadFile || !uploadName.trim()) return
    setUploading(true)
    setUploadError(null)
    const fd = new FormData()
    fd.append('file', uploadFile)
    const res = await uploadTemplateImage(uploadName.trim(), fd)
    if (res.error) {
      setUploadError(res.error)
    } else if (res.url) {
      const newImg = { name: uploadName.trim(), url: res.url }
      setImages(prev => [...prev, newImg])
      setSelectedImageUrl(res.url)
      setAddingNew(false)
      setUploadName('')
      setUploadFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    setUploading(false)
  }

  // Step 2 logic
  const q = search.toLowerCase()
  const visible = q
    ? sorted.filter(c => c.full_name.toLowerCase().includes(q) || (c.phone ?? '').includes(q))
    : sorted

  const visibleSelectable = visible.filter(c => c.phone)
  const allChecked = visibleSelectable.length > 0 && visibleSelectable.every(c => selected.has(c.id))
  const someChecked = visibleSelectable.some(c => selected.has(c.id))

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someChecked && !allChecked
      selectAllRef.current.checked = allChecked
    }
  }, [allChecked, someChecked])

  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const handleSelectAll = () => {
    if (allChecked) {
      setSelected(prev => { const n = new Set(prev); visibleSelectable.forEach(c => n.delete(c.id)); return n })
    } else {
      setSelected(prev => { const n = new Set(prev); visibleSelectable.forEach(c => n.add(c.id)); return n })
    }
  }

  const handleSend = async () => {
    const recipients = sorted
      .filter(c => selected.has(c.id) && c.phone)
      .map(c => ({ phone: c.phone!, firstName: c.full_name.split(' ')[0] }))
    if (recipients.length === 0) return
    if (currentTemplate.hasImage && !selectedImageUrl) return

    setSending(true)
    setResult(null)
    try {
      const { sent, failed } = await sendReorderBroadcast(recipients, selectedImageUrl!)
      setResult(failed === 0
        ? `✅ ${sent} mensajes enviados correctamente`
        : `✅ ${sent} enviados · ❌ ${failed} fallaron`)
    } catch {
      setResult('❌ Error al enviar — revisa los logs del servidor')
    } finally {
      setSending(false)
    }
  }

  const canProceed = !currentTemplate.hasImage || (selectedImageUrl !== null && !addingNew)

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
      <div style={{ background: colors.grayDark, border: `1px solid ${colors.grayLight}`, borderRadius: 12, width: '100%', maxWidth: 480, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${colors.grayLight}33`, flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.white }}>Enviar WhatsApp</div>
            <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              Paso {step} de 2 — {step === 1 ? 'Seleccionar template e imagen' : `${selected.size} destinatarios`}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 4 }}>×</button>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {/* Template selector */}
            <div style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Template</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {TEMPLATES.map(t => (
                <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, border: `1px solid ${selectedTemplate === t.id ? colors.orange : colors.grayLight}`, background: selectedTemplate === t.id ? colors.orange + '11' : 'transparent', cursor: 'pointer' }}>
                  <input type="radio" name="template" value={t.id} checked={selectedTemplate === t.id} onChange={() => setSelectedTemplate(t.id)} style={{ accentColor: colors.orange, width: 15, height: 15 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: colors.white }}>{t.label}</div>
                    <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{t.description}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Image picker */}
            {currentTemplate.hasImage && (
              <>
                <div style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Imagen del template</div>
                {imagesLoading ? (
                  <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16 }}>Cargando imágenes…</div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: addingNew ? 16 : 0 }}>
                      {images.map(img => (
                        <button key={img.url} onClick={() => { setSelectedImageUrl(img.url); setAddingNew(false) }} style={{ padding: 0, border: `2px solid ${selectedImageUrl === img.url && !addingNew ? colors.orange : colors.grayLight}`, borderRadius: 8, cursor: 'pointer', background: 'transparent', overflow: 'hidden', aspectRatio: '1', position: 'relative' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          {selectedImageUrl === img.url && !addingNew && (
                            <div style={{ position: 'absolute', top: 4, right: 4, background: colors.orange, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700 }}>✓</div>
                          )}
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '3px 6px', fontSize: 10, color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{img.name}</div>
                        </button>
                      ))}
                      {/* New card */}
                      <button onClick={() => { setAddingNew(true); setSelectedImageUrl(null); setUploadError(null) }} style={{ border: `2px dashed ${addingNew ? colors.orange : colors.grayLight}`, borderRadius: 8, cursor: 'pointer', background: addingNew ? colors.orange + '11' : 'transparent', aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: addingNew ? colors.orange : colors.textMuted }}>
                        <span style={{ fontSize: 22, lineHeight: 1 }}>+</span>
                        <span style={{ fontSize: 11, fontWeight: 600 }}>Nueva</span>
                      </button>
                    </div>

                    {/* Upload form — only shown when "Nueva" is selected */}
                    {addingNew && (
                      <div style={{ padding: 14, background: colors.black + '88', border: `1px solid ${colors.grayLight}33`, borderRadius: 10 }}>
                        <input
                          placeholder="Nombre (ej: reorder-julio-2026)"
                          value={uploadName}
                          onChange={e => setUploadName(e.target.value)}
                          style={{ width: '100%', padding: '7px 12px', marginBottom: 8, background: colors.black, border: `1px solid ${colors.grayLight}`, borderRadius: 7, color: colors.white, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }}
                        />
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input ref={fileInputRef} type="file" accept="image/*" onChange={e => setUploadFile(e.target.files?.[0] ?? null)} style={{ flex: 1, fontSize: 12, color: colors.textMuted }} />
                          <button onClick={handleUpload} disabled={!uploadFile || !uploadName.trim() || uploading} style={{ padding: '7px 14px', background: colors.orange, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (!uploadFile || !uploadName.trim() || uploading) ? 0.5 : 1, whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                            {uploading ? 'Subiendo…' : 'Guardar'}
                          </button>
                        </div>
                        {uploadError && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>{uploadError}</div>}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <div style={{ padding: '12px 24px 12px', borderBottom: `1px solid ${colors.grayLight}33`, flexShrink: 0 }}>
              <input
                placeholder="Buscar por nombre o teléfono…"
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '7px 12px', marginBottom: 12, background: colors.black, border: `1px solid ${colors.grayLight}`, borderRadius: 7, color: colors.white, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input ref={selectAllRef} type="checkbox" onChange={handleSelectAll} style={{ width: 15, height: 15, accentColor: colors.orange, cursor: 'pointer' }} />
                <span style={{ fontSize: 13, color: colors.textSecondary }}>Seleccionar todos · {visibleSelectable.length} con teléfono</span>
              </label>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 24px' }}>
              {visible.map((c, idx) => {
                const canSelect = !!c.phone
                return (
                  <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: idx < visible.length - 1 ? `1px solid ${colors.grayLight}22` : 'none', cursor: canSelect ? 'pointer' : 'default', opacity: canSelect ? 1 : 0.4 }}>
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => canSelect && toggle(c.id)} disabled={!canSelect} style={{ width: 15, height: 15, accentColor: colors.orange, cursor: canSelect ? 'pointer' : 'not-allowed', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: colors.white }}>{c.full_name}</div>
                      {c.phone && <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>{c.phone}</div>}
                    </div>
                    {!canSelect && <span style={{ fontSize: 11, color: colors.textMuted, flexShrink: 0 }}>sin tel.</span>}
                  </label>
                )
              })}
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: `1px solid ${colors.grayLight}33`, flexShrink: 0 }}>
          {step === 2 && result && (
            <div style={{ padding: '8px 12px', marginBottom: 12, background: result.startsWith('✅') ? '#10b98118' : '#ef444418', border: `1px solid ${result.startsWith('✅') ? '#10b98144' : '#ef444444'}`, borderRadius: 8, fontSize: 13, color: colors.white }}>
              {result}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            {step === 2 && (
              <button onClick={() => { setResult(null); setStep(1) }} style={{ padding: '11px 16px', background: 'transparent', color: colors.textMuted, border: `1px solid ${colors.grayLight}`, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Atrás
              </button>
            )}
            {step === 1 && (
              <button onClick={() => setStep(2)} disabled={!canProceed} style={{ flex: 1, padding: '11px 20px', background: canProceed ? colors.orange : colors.grayLight, color: colors.white, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: canProceed ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                Siguiente →
              </button>
            )}
            {step === 2 && (
              <button onClick={handleSend} disabled={selected.size === 0 || sending} style={{ flex: 1, padding: '11px 20px', background: selected.size === 0 ? colors.grayLight : colors.orange, color: colors.white, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: selected.size === 0 || sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1, fontFamily: 'inherit' }}>
                {sending ? 'Enviando…' : `Enviar a ${selected.size} ${selected.size === 1 ? 'cliente' : 'clientes'} →`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CustomersClient({ customers, guestCustomers, sizes, highlightId }: {
  customers: CustomerRow[]
  guestCustomers: CustomerRow[]
  sizes: SizeOption[]
  highlightId: string | null
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'cuenta' | 'invitado'>('cuenta')
  const [waModalOpen, setWaModalOpen] = useState(false)
  const [configCustomer, setConfigCustomer] = useState<CustomerRow | null>(null)
  const [detailCustomer, setDetailCustomer] = useState<CustomerRow | null>(null)
  const highlightRef = useRef<HTMLDivElement | null>(null)

  const sorted = useMemo(() =>
    [...customers].sort((a, b) => lastOrderTs(b) - lastOrderTs(a)),
    [customers]
  )

  const sortedGuests = useMemo(() =>
    [...guestCustomers].sort((a, b) => lastOrderTs(b) - lastOrderTs(a)),
    [guestCustomers]
  )

  const allForModal = useMemo(() => [...sorted, ...sortedGuests], [sorted, sortedGuests])

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightId])

  const q = search.toLowerCase()
  const filtered = q
    ? sorted.filter(c => c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone ?? '').includes(q))
    : sorted
  const filteredGuests = q
    ? sortedGuests.filter(c => c.full_name.toLowerCase().includes(q) || (c.phone ?? '').includes(q))
    : sortedGuests

  const tabBtn = (id: 'cuenta' | 'invitado', label: string, count: number) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
        border: 'none',
        background: tab === id ? colors.orange : colors.grayLight,
        color: colors.white,
        fontFamily: 'inherit',
      }}
    >
      {label} <span style={{ opacity: 0.75, fontWeight: 400 }}>{count}</span>
    </button>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.white, margin: 0 }}>Clientes</h1>
        <button onClick={() => setWaModalOpen(true)} style={{ marginLeft: 'auto', padding: '9px 20px', background: colors.orange, color: colors.white, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
          Enviar WhatsApp
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {tabBtn('cuenta', 'Con cuenta', sorted.length)}
        {tabBtn('invitado', 'Invitados', sortedGuests.length)}
        <input
          placeholder="Buscar…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ marginLeft: 'auto', width: 200, padding: '7px 12px', background: colors.grayDark, border: `1px solid ${colors.grayLight}`, borderRadius: 8, color: colors.white, fontSize: 13, boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tab === 'cuenta' && (
          <>
            {filtered.length === 0 && <p style={{ color: colors.textMuted }}>Sin resultados.</p>}
            {filtered.map(c => (
              <CustomerCard
                key={c.id}
                customer={c}
                isHighlight={c.id === highlightId}
                highlightRef={c.id === highlightId ? highlightRef : { current: null }}
                onConfigClick={() => setConfigCustomer(c)}
                onDetailClick={() => setDetailCustomer(c)}
              />
            ))}
          </>
        )}
        {tab === 'invitado' && (
          <>
            {filteredGuests.length === 0 && <p style={{ color: colors.textMuted }}>Sin resultados.</p>}
            {filteredGuests.map(c => (
              <CustomerCard
                key={c.id}
                customer={c}
                isHighlight={false}
                highlightRef={{ current: null }}
                onConfigClick={() => {}}
                onDetailClick={() => setDetailCustomer(c)}
              />
            ))}
          </>
        )}
      </div>

      {waModalOpen && <WhatsAppModal sorted={allForModal} onClose={() => setWaModalOpen(false)} />}

      {detailCustomer && (
        <OrdersDrawer customer={detailCustomer} onClose={() => setDetailCustomer(null)} />
      )}

      {configCustomer && (
        <MembershipModal
          customer={configCustomer}
          sizes={sizes}
          onClose={() => setConfigCustomer(null)}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  )
}
