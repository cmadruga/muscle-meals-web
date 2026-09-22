'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { updateCustomerProfile } from '@/app/actions/customer'
import { validateCP, isValidPostalCode, getZoneByPostalCode } from '@/lib/address-validation'
import type { Customer } from '@/lib/types'

/* ── Design tokens ─────────────────────────────────────────────────────────── */
const F = {
  display: `Franchise,'Big Shoulders Display',sans-serif`,
  body: `Barlow,system-ui,sans-serif`,
  cond: `'Barlow Condensed',Barlow,sans-serif`,
}
const C = {
  page:    '#0f0d0c',
  card:    '#141110',
  overlay: '#191614',
  orange:  '#F79138',
  onOrange:'#17140f',
  text:    '#F5F1EC',
  amber:   '#E8B54A',
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtAmt(cents: number) {
  return `$${(cents / 100).toFixed(0)} MXN`
}
function fmtAmtShort(cents: number) {
  return `$${(cents / 100).toFixed(0)}`
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; bg: string; border?: string; color: string }> = {
    paid:      { label: 'Pagado',    bg: 'rgba(47,168,116,.14)', border: '1px solid rgba(47,168,116,.4)',  color: '#4fce93' },
    cancelled: { label: 'Cancelado', bg: 'rgba(214,84,74,.12)', border: '1px solid rgba(214,84,74,.34)',  color: '#e08078' },
    creado:    { label: 'Creado',    bg: 'rgba(255,255,255,.06)', color: 'rgba(245,241,236,.6)' },
    pending:   { label: 'Pendiente', bg: 'rgba(255,255,255,.06)', color: 'rgba(245,241,236,.6)' },
    extra:     { label: 'Extra',     bg: 'rgba(168,85,247,.12)',  color: '#c084fc' },
    admin:     { label: 'Admin',     bg: 'rgba(6,182,212,.12)',   color: '#67e8f9' },
  }
  const c = cfg[status] ?? cfg.creado
  return (
    <span style={{
      padding: '4px 9px', borderRadius: 20,
      background: c.bg, border: c.border,
      font: `600 10.5px/1 ${F.body}`, letterSpacing: '.06em',
      textTransform: 'uppercase', color: c.color, flexShrink: 0,
    }}>{c.label}</span>
  )
}

/* ── Parse stored address ──────────────────────────────────────────────────── */
function parseAddr(addr: string | null) {
  if (!addr) return { calle: '', numExt: '', numInt: '', colonia: '', cp: '', ciudad: '' }
  const cpM = addr.match(/C\.P\. (\d{5})/)
  const colM = addr.match(/Col\. ([^,]+)/)
  const intM = addr.match(/Int\. ([^,]+)/)
  const cp = cpM?.[1] ?? ''
  const colonia = colM?.[1]?.trim() ?? ''
  const numInt = intM?.[1]?.trim() ?? ''
  const before = addr.split(/,\s*(?:Int\.|Col\.)/)[0]
  const parts = before.split(',').map(s => s.trim()).filter(Boolean)
  const calle = parts[0] ?? ''
  const numExt = parts[1] ?? ''
  const ciudadM = addr.match(/,\s*([^,]+),\s*N\.L\./)
  const ciudad = ciudadM?.[1]?.trim() ?? 'Monterrey'
  return { calle, numExt, numInt, colonia, cp, ciudad }
}

/* ── Floating label input ──────────────────────────────────────────────────── */
function FloatInput({
  label, name, type = 'text', value, onChange, placeholder, readOnly, style: extraStyle,
}: {
  label: string; name?: string; type?: string; value: string
  onChange?: (v: string) => void; placeholder?: string; readOnly?: boolean; style?: React.CSSProperties
}) {
  return (
    <label style={{ display: 'block', position: 'relative', ...extraStyle }}>
      <span style={{
        position: 'absolute', top: 9, left: 14,
        font: `600 9.5px/1 ${F.body}`, letterSpacing: '.12em',
        textTransform: 'uppercase', color: 'rgba(245,241,236,.42)',
        pointerEvents: 'none',
      }}>{label}</span>
      <input
        name={name} type={type} value={value} placeholder={placeholder}
        readOnly={readOnly}
        onChange={e => onChange?.(e.target.value)}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '25px 14px 9px',
          background: 'rgba(255,255,255,.04)',
          border: '1px solid rgba(255,255,255,.12)',
          borderRadius: 9,
          color: C.text, font: `400 15px/1 ${F.body}`,
          outline: 'none', fontFamily: 'inherit',
          WebkitAppearance: 'none',
          fontSize: 16, // evitar zoom en iOS
        }}
      />
    </label>
  )
}

/* ── Props ─────────────────────────────────────────────────────────────────── */
export type OrderRow = {
  id: string
  created_at: string
  total_amount: number
  status: string
  shipping_cost?: number | null
  order_number?: string | null
}
export type ItemRow = {
  id: string
  order_id: string
  meal_id: string
  size_id: string
  qty: number
  unit_price: number
  package_instance_id: string | null
  meals: { name: string } | null
  sizes: { name: string } | null
}

type Props = {
  customer: Customer | null
  lastOrder: OrderRow | null
  lastOrderItems: ItemRow[]
  historyOrders: OrderRow[]   // next 2 orders after lastOrder
  orderCount: number
  referralCode: string | null
  totalReferrals: number
  pendingRewards: number
  membershipWeeksTotal: number  // 4 | 8 | 12 — from most recent membership order
}

/* ─────────────────────────────────────────────────────────────────────────── */
export default function CuentaClient({
  customer, lastOrder, lastOrderItems, historyOrders,
  orderCount, referralCode, totalReferrals, pendingRewards, membershipWeeksTotal,
}: Props) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [copied, setCopied]     = useState(false)
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)

  /* ── Edit form state ── */
  const addr = parseAddr(customer?.address ?? null)
  const [fullName, setFullName] = useState(customer?.full_name ?? '')
  const [phone,    setPhone]    = useState(customer?.phone ?? '')
  const [calle,    setCalle]    = useState(addr.calle)
  const [numInt,   setNumInt]   = useState(addr.numInt)
  const [colonia,  setColonia]  = useState(addr.colonia)
  const [cp,       setCp]       = useState(addr.cp)

  const cpValido = validateCP(cp) && isValidPostalCode(cp)
  const ciudad = cpValido ? (getZoneByPostalCode(cp) ?? 'Monterrey') : 'Monterrey'

  const openEdit = () => {
    const a = parseAddr(customer?.address ?? null)
    setFullName(customer?.full_name ?? '')
    setPhone(customer?.phone ?? '')
    setCalle(a.calle); setNumInt(a.numInt)
    setColonia(a.colonia); setCp(a.cp)
    setFormError(null)
    setEditando(true)
  }
  const cancelEdit = () => setEditando(false)

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await updateCustomerProfile(undefined as any, fd)
      if (res?.error) { setFormError(res.error); return }
      setEditando(false)
      router.refresh()
    })
  }

  /* ── Referral copy ── */
  const handleCopy = () => {
    if (!referralCode) return
    navigator.clipboard.writeText(referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  /* ── Membership ── */
  const isMember   = customer?.is_member ?? false
  const weeksLeft  = customer?.membership_weeks_left ?? 0
  const weeksTotal = membershipWeeksTotal  // 4 | 8 | 12 from most recent membership order
  const weeksUsed  = Math.max(0, weeksTotal - weeksLeft)
  const progress   = weeksTotal === 0 ? 0 : Math.round((weeksUsed / weeksTotal) * 100)
  const isExpired  = isMember && weeksLeft === 0

  const membershipQty = customer?.membership_qty

  /* ── Display name parts ── */
  const fullNameParts = (customer?.full_name ?? '').trim().split(' ')
  const firstName  = fullNameParts[0] ?? ''
  const lastNameParts = fullNameParts.slice(1).join(' ')

  const memberSince = customer?.created_at
    ? new Date(customer.created_at).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
    : null

  /* ── Last order items as chips ── */
  const chips = lastOrderItems.map(i => ({
    meal: i.meals?.name ?? 'Platillo',
    size: i.sizes?.name ?? '',
    qty: i.qty,
  }))

  /* ── Address display ── */
  const hasAddress = !!customer?.address
  const addrParsed = parseAddr(customer?.address ?? null)

  /* ── Edit form JSX (shared desktop modal + mobile screen) ── */
  const editForm = (onCancel: () => void) => (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input type="hidden" name="estado" value="Nuevo León" />
      <input type="hidden" name="ciudad" value={ciudad} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FloatInput label="Nombre completo" name="full_name" value={fullName} onChange={setFullName} />
        <FloatInput label="WhatsApp" name="phone" type="tel" value={phone} onChange={setPhone} />
      </div>
      <div style={{ margin: '8px 0 2px', font: `600 10px/1 ${F.body}`, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(245,241,236,.4)' }}>
        Dirección de entrega
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: 12 }}>
        <FloatInput label="Calle y número" name="calle" value={calle} onChange={setCalle} />
        <FloatInput label="Interior" name="numeroInterior" value={numInt} onChange={setNumInt} placeholder="Opcional" />
      </div>
      <input type="hidden" name="numeroExterior" value="." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr', gap: 12 }}>
        <FloatInput label="Colonia" name="colonia" value={colonia} onChange={setColonia} />
        <FloatInput label="C.P." name="codigoPostal" value={cp} onChange={v => { const n = v.replace(/\D/g,''); if (n.length <= 5) setCp(n) }} />
        <FloatInput label="Ciudad" name="ciudadDisplay" value={ciudad} readOnly />
      </div>
      {cp.length === 5 && !cpValido && (
        <p style={{ margin: 0, font: `400 12.5px/1.4 ${F.body}`, color: '#ff8080' }}>
          CP fuera del área de entrega (solo Área Metropolitana de Monterrey)
        </p>
      )}
      {formError && <p style={{ margin: 0, font: `400 12.5px/1 ${F.body}`, color: '#ff8080' }}>{formError}</p>}
      <div style={{ display: 'flex', gap: 11, marginTop: 10 }}>
        <button type="button" onClick={onCancel} style={{
          flexShrink: 0, padding: '15px 22px',
          border: '1px solid rgba(255,255,255,.16)', borderRadius: 9,
          background: 'transparent',
          font: `600 13px/1 ${F.body}`, color: C.text, cursor: 'pointer',
        }}>Cancelar</button>
        <button type="submit" disabled={isPending} style={{
          flex: 1, padding: '15px 0', border: 'none', borderRadius: 9,
          background: C.orange, color: C.onOrange,
          font: `700 18px/1 ${F.display}`, letterSpacing: '.08em', textTransform: 'uppercase',
          cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? .7 : 1,
        }}>{isPending ? 'Guardando…' : 'Guardar cambios'}</button>
      </div>
    </form>
  )

  /* ── Membership band ── */
  const membershipBand = () => {
    if (!isMember) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 30,
          padding: '22px 26px', marginBottom: 24, borderRadius: 12,
          border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.03)',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: `700 22px/1 ${F.display}`, letterSpacing: '.02em', textTransform: 'uppercase', color: C.text }}>Sin membresia</div>
            <div style={{ marginTop: 9, font: `400 13px/1.45 ${F.body}`, color: 'rgba(245,241,236,.62)' }}>
              Los miembros fijan su plan semanal y pagan menos por platillo. Puedes activarla cuando quieras — nada se cobra automatico.
            </div>
          </div>
          {/* Ver planes — pendiente */}
        </div>
      )
    }
    if (isExpired) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 34,
          padding: '20px 26px', marginBottom: 24, borderRadius: 12,
          background: 'linear-gradient(100deg,rgba(232,181,74,.15) 0%,rgba(232,181,74,.04) 62%)',
          border: '1px solid rgba(232,181,74,.42)',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ padding: '4px 9px', borderRadius: 5, background: C.amber, color: C.onOrange, font: `700 10px/1 ${F.body}`, letterSpacing: '.16em', textTransform: 'uppercase' }}>Por renovar</span>
              <span style={{ font: `700 22px/1 ${F.display}`, letterSpacing: '.02em', textTransform: 'uppercase', color: C.text }}>
                {membershipQty ? `Plan ${membershipQty} comidas` : 'Tu plan'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
              <span style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,.12)', overflow: 'hidden', display: 'block' }}>
                <span style={{ display: 'block', width: '100%', height: '100%', borderRadius: 3, background: C.orange }} />
              </span>
              <span style={{ flexShrink: 0, font: `600 12.5px/1 ${F.body}`, color: C.text }}>Semana {weeksTotal} de {weeksTotal}</span>
            </div>
            <div style={{ marginTop: 9, font: `400 12.5px/1.4 ${F.body}`, color: 'rgba(245,241,236,.72)' }}>
              Usaste tus {weeksTotal} semanas. <strong style={{ color: C.amber, fontWeight: 700 }}>Renueva para seguir pidiendo al precio de miembro</strong> — el plan no se cobra automatico, tu decides cuándo.
            </div>
          </div>
          {/* Renovar — pendiente */}
        </div>
      )
    }
    // Active with weeks remaining
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 34,
        padding: '20px 26px', marginBottom: 24, borderRadius: 12,
        background: 'linear-gradient(100deg,rgba(247,145,56,.16) 0%,rgba(247,145,56,.05) 62%)',
        border: '1px solid rgba(247,145,56,.34)',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ padding: '4px 9px', borderRadius: 5, background: C.orange, color: C.onOrange, font: `700 10px/1 ${F.body}`, letterSpacing: '.16em', textTransform: 'uppercase' }}>Miembro</span>
            <span style={{ font: `700 22px/1 ${F.display}`, letterSpacing: '.02em', textTransform: 'uppercase', color: C.text }}>
              {membershipQty ? `Plan ${membershipQty} comidas` : 'Tu plan'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
            <span style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,.12)', overflow: 'hidden', display: 'block' }}>
              <span style={{ display: 'block', width: `${progress}%`, height: '100%', borderRadius: 3, background: C.orange }} />
            </span>
            <span style={{ flexShrink: 0, font: `600 12.5px/1 ${F.body}`, color: C.text }}>Semana {weeksUsed} de {weeksTotal}</span>
          </div>
          <div style={{ marginTop: 9, font: `400 12.5px/1.4 ${F.body}`, color: 'rgba(245,241,236,.72)' }}>
            Te quedan <strong style={{ color: C.text, fontWeight: 600 }}>{weeksLeft} semana{weeksLeft !== 1 ? 's' : ''}</strong>. Te avisamos para renovar cuando se acabe — no se cobra solo.
          </div>
        </div>
          {/* Ver plan — pendiente */}
      </div>
    )
  }

  /* ── Mobile membership band ── */
  const mobileMembershipBand = () => {
    if (!isMember) return (
      <div style={{ marginTop: 20, padding: '16px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.03)' }}>
        <div style={{ font: `700 18px/1 ${F.display}`, letterSpacing: '.02em', textTransform: 'uppercase', color: C.text }}>Sin membresia</div>
        <div style={{ marginTop: 8, font: `400 12.5px/1.45 ${F.body}`, color: 'rgba(245,241,236,.6)' }}>Puedes activarla cuando quieras — nada se cobra automatico.</div>
        {/* Ver planes — pendiente */}
      </div>
    )
    const bandColor = isExpired ? C.amber : C.orange
    const bandBg = isExpired
      ? 'linear-gradient(120deg,rgba(232,181,74,.17) 0%,rgba(232,181,74,.05) 70%)'
      : 'linear-gradient(120deg,rgba(247,145,56,.17) 0%,rgba(247,145,56,.05) 70%)'
    const bandBorder = isExpired ? 'rgba(232,181,74,.34)' : 'rgba(247,145,56,.34)'
    return (
      <div style={{ marginTop: 20, padding: '16px 18px', borderRadius: 12, background: bandBg, border: `1px solid ${bandBorder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ padding: '4px 8px', borderRadius: 5, background: bandColor, color: C.onOrange, font: `700 9.5px/1 ${F.body}`, letterSpacing: '.14em', textTransform: 'uppercase' }}>{isExpired ? 'Por renovar' : 'Miembro'}</span>
          <span style={{ font: `700 18px/1 ${F.display}`, letterSpacing: '.02em', textTransform: 'uppercase', color: C.text }}>{membershipQty ? `${membershipQty} comidas` : 'Tu plan'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 13 }}>
          <span style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,.12)', overflow: 'hidden', display: 'block' }}>
            <span style={{ display: 'block', width: `${progress}%`, height: '100%', borderRadius: 3, background: C.orange }} />
          </span>
          <span style={{ flexShrink: 0, font: `600 11.5px/1 ${F.body}`, color: C.text }}>Semana {weeksUsed} de {weeksTotal}</span>
        </div>
        <div style={{ marginTop: 8, font: `400 12px/1.4 ${F.body}`, color: 'rgba(245,241,236,.72)' }}>
          {isExpired ? 'Usaste tus semanas. Renueva para seguir al precio de miembro.' : `Te quedan ${weeksLeft} semana${weeksLeft !== 1 ? 's' : ''}.`}
        </div>
        {/* Renovar / Ver plan — pendiente */}
      </div>
    )
  }

  /* ── Referral footer copy ── */
  const referralFooter = () => {
    if (totalReferrals === 0) return 'Aún nadie lo ha usado — compártelo por WhatsApp.'
    return `${totalReferrals} amigo${totalReferrals !== 1 ? 's' : ''} ya lo ${totalReferrals !== 1 ? 'usaron' : 'usó'}${pendingRewards > 0 ? ` · ${pendingRewards} recompensa${pendingRewards !== 1 ? 's' : ''} pendiente${pendingRewards !== 1 ? 's' : ''}` : ''}.`
  }

  /* ─────────────────────────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        body { background: ${C.page}; }
        .ct-hover-row:hover { background: rgba(255,255,255,.025) !important; }
        .ct-btn-orange:hover { background: #ffa252 !important; }
        .ct-btn-ghost:hover  { background: rgba(255,255,255,.06) !important; }
        .ct-link-ver:hover   { color: #ffab5e !important; }
        .ct-desktop { display: block; }
        .ct-mobile  { display: none; }
        @media (max-width: 680px) {
          .ct-desktop { display: none !important; }
          .ct-mobile  { display: block !important; }
        }
      `}</style>

      {/* ══ DESKTOP ════════════════════════════════════════════════════════════ */}
      <main className="ct-desktop" style={{ background: C.page, padding: '38px 44px 60px', minHeight: '100vh' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 30 }}>
          <div>
            <div style={{ font: `600 11px/1 ${F.body}`, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(245,241,236,.42)' }}>Mi cuenta</div>
            <h1 style={{ margin: '9px 0 0', font: `700 52px/.92 ${F.display}`, textTransform: 'uppercase', color: C.text }}>
              {firstName} <span style={{ color: C.orange }}>{lastNameParts}</span>
            </h1>
            <div style={{ marginTop: 8, font: `400 13.5px/1 ${F.body}`, color: 'rgba(245,241,236,.5)' }}>
              {customer?.email ?? ''}
              {memberSince && <> · cliente desde {memberSince}</>}
            </div>
          </div>
          <Link href="/cuenta/pedidos" style={{
            flexShrink: 0, padding: '12px 20px',
            border: '1px solid rgba(255,255,255,.16)', borderRadius: 8,
            font: `600 13px/1 ${F.body}`, color: C.text, textDecoration: 'none',
          }}>Ver todos mis pedidos →</Link>
        </div>

        {/* Membership band */}
        {membershipBand()}

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 372px', gap: 24, alignItems: 'start' }}>

          {/* Left: orders card */}
          <div style={{ background: C.card, border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '18px 22px 15px' }}>
              <span style={{ font: `700 21px/1 ${F.display}`, letterSpacing: '.02em', textTransform: 'uppercase', color: C.text }}>Mis pedidos</span>
              <span style={{ font: `500 12.5px/1 ${F.body}`, color: 'rgba(245,241,236,.45)' }}>{orderCount} en total</span>
            </div>

            {lastOrder ? (
              <>
                {/* Last order block */}
                <div style={{ padding: '16px 22px 18px', borderTop: '1px solid rgba(255,255,255,.07)', background: 'rgba(255,255,255,.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ font: `600 10.5px/1 ${F.body}`, letterSpacing: '.18em', textTransform: 'uppercase', color: C.orange }}>Último pedido</span>
                    <span style={{ font: `500 13px/1 ${F.body}`, color: C.text }}>{fmtDate(lastOrder.created_at)}</span>
                    <StatusBadge status={lastOrder.status} />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
                    {chips.map((c, i) => (
                      <span key={i} style={{ padding: '6px 11px', borderRadius: 7, background: 'rgba(255,255,255,.05)', font: `500 12.5px/1 ${F.body}`, color: 'rgba(245,241,236,.8)' }}>
                        {c.meal}{c.qty > 1 ? ` ×${c.qty}` : ''} <span style={{ color: 'rgba(245,241,236,.45)' }}>{c.size}</span>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <a href="/reorder" className="ct-btn-orange" style={{
                      flex: 1, padding: '14px 0', border: 'none', borderRadius: 8,
                      background: C.orange, color: C.onOrange,
                      font: `700 18px/1 ${F.display}`, letterSpacing: '.08em', textTransform: 'uppercase',
                      textDecoration: 'none', textAlign: 'center', display: 'block',
                    }}>Volver a pedir →</a>
                    <Link href="/cuenta/pedidos" style={{
                      flexShrink: 0, padding: '14px 18px',
                      border: '1px solid rgba(255,255,255,.14)', borderRadius: 8,
                      font: `600 12.5px/1 ${F.body}`, color: C.text, textDecoration: 'none',
                    }}>Ver detalle</Link>
                    <span style={{ flexShrink: 0, font: `700 17px/1 ${F.display}`, color: C.text }}>{fmtAmt(lastOrder.total_amount)}</span>
                  </div>
                </div>

                {/* History rows */}
                {historyOrders.map((o) => (
                  <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
                    <span style={{ flex: 1, font: `500 13.5px/1 ${F.body}`, color: 'rgba(245,241,236,.78)' }}>{fmtDate(o.created_at)}</span>
                    <span style={{ font: `400 12.5px/1 ${F.body}`, color: 'rgba(245,241,236,.42)' }}>{/* items count from items — approximate */}pedido</span>
                    <StatusBadge status={o.status} />
                    <span style={{ width: 74, textAlign: 'right', font: `600 13.5px/1 ${F.body}`, color: o.status === 'cancelled' ? 'rgba(245,241,236,.45)' : C.text }}>{fmtAmtShort(o.total_amount)}</span>
                  </div>
                ))}

                {/* Footer link */}
                <Link href="/cuenta/pedidos" className="ct-link-ver" style={{ display: 'block', padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,.06)', font: `600 12.5px/1 ${F.body}`, color: C.orange, textDecoration: 'none' }}>
                  Ver los {orderCount} pedidos →
                </Link>
              </>
            ) : (
              <div style={{ padding: '52px 24px', textAlign: 'center' }}>
                <div style={{ font: `700 24px/1 ${F.display}`, letterSpacing: '.02em', textTransform: 'uppercase', color: C.text }}>Todavia no tienes pedidos</div>
                <p style={{ margin: '11px auto 20px', maxWidth: '40ch', font: `400 13.5px/1.5 ${F.body}`, color: 'rgba(245,241,236,.55)' }}>Cuando hagas el primero lo verás aquí y podrás repetirlo en un clic.</p>
                <Link href="/menu" style={{ display: 'inline-block', padding: '14px 26px', background: C.orange, color: C.onOrange, border: `1px solid ${C.orange}`, borderRadius: 8, font: `600 13px/1 ${F.body}`, textDecoration: 'none' }}>Ver el menú de la semana →</Link>
              </div>
            )}
          </div>

          {/* Right: datos + referido */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Mis datos */}
            <div style={{
              background: C.card,
              border: editando ? '1.5px solid rgba(247,145,56,.55)' : '1px solid rgba(255,255,255,.08)',
              borderRadius: 12, padding: '20px 22px 22px',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
                <span style={{ font: `700 19px/1 ${F.display}`, letterSpacing: '.02em', textTransform: 'uppercase', color: C.text }}>Mis datos</span>
                <button onClick={editando ? cancelEdit : openEdit} style={{ background: 'none', border: 'none', font: `600 12.5px/1 ${F.body}`, color: C.orange, cursor: 'pointer', padding: 0 }}>
                  {editando ? 'Editando…' : 'Editar'}
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15, opacity: editando ? .5 : 1 }}>
                <div>
                  <div style={{ font: `600 10px/1 ${F.body}`, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(245,241,236,.4)' }}>WhatsApp</div>
                  <div style={{ marginTop: 6, font: `500 14.5px/1.3 ${F.body}`, color: C.text }}>
                    {customer?.phone ?? <span style={{ color: 'rgba(245,241,236,.45)' }}>Sin teléfono</span>}
                  </div>
                </div>
                <div>
                  <div style={{ font: `600 10px/1 ${F.body}`, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(245,241,236,.4)' }}>Entrega</div>
                  <div style={{ marginTop: 6, font: `500 14.5px/1.45 ${F.body}`, color: hasAddress ? C.text : 'rgba(245,241,236,.45)' }}>
                    {hasAddress
                      ? <>{addrParsed.calle}{addrParsed.numExt ? ` ${addrParsed.numExt}` : ''}{addrParsed.colonia ? `, Col. ${addrParsed.colonia}` : ''}<br /><span style={{ color: 'rgba(245,241,236,.55)', fontWeight: 400 }}>{addrParsed.cp ? `C.P. ${addrParsed.cp}` : ''}{addrParsed.ciudad ? ` · ${addrParsed.ciudad}, N.L.` : ''}</span></>
                      : 'Sin dirección guardada — la pides en tu primer pedido.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Referido */}
            {referralCode && (
              <div id="invitar" style={{ background: C.card, border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: '20px 22px 22px' }}>
                <div style={{ font: `700 19px/1 ${F.display}`, letterSpacing: '.02em', textTransform: 'uppercase', color: C.text }}>Invita y ganan los dos</div>
                <p style={{ margin: '9px 0 16px', font: `400 13px/1.45 ${F.body}`, color: 'rgba(245,241,236,.6)' }}>
                  Tu amigo recibe <strong style={{ color: C.text, fontWeight: 600 }}>10% off</strong> en su primer pedido y tú otro <strong style={{ color: C.text, fontWeight: 600 }}>10% off</strong> en el siguiente.
                </p>
                <div style={{ display: 'flex', alignItems: 'stretch', gap: 9, marginBottom: 16 }}>
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', padding: '10px 14px', border: '1px dashed rgba(247,145,56,.45)', borderRadius: 8, background: 'rgba(247,145,56,.06)', font: `700 15px/1 ${F.cond}`, letterSpacing: '.12em', textTransform: 'uppercase', color: C.orange }}>
                    {referralCode.toUpperCase()}
                  </span>
                  <button className="ct-btn-orange" onClick={handleCopy} style={{ flexShrink: 0, padding: '0 18px', border: 'none', borderRadius: 8, background: C.orange, color: C.onOrange, font: `700 13px/1 ${F.body}`, cursor: 'pointer' }}>
                    {copied ? 'Copiado ✓' : 'Copiar'}
                  </button>
                </div>
                <div style={{ paddingTop: 15, borderTop: '1px solid rgba(255,255,255,.07)', font: `500 12.5px/1.4 ${F.body}`, color: 'rgba(245,241,236,.55)' }}>
                  {referralFooter()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop edit modal */}
        {editando && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(8,7,6,.74)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0',
          }}>
            <div style={{ width: 620, background: C.overlay, border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.6)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, padding: '24px 28px 0' }}>
                <div>
                  <div style={{ font: `700 26px/1 ${F.display}`, letterSpacing: '.02em', textTransform: 'uppercase', color: C.text }}>Editar mis datos</div>
                  <p style={{ margin: '8px 0 0', font: `400 12.5px/1.4 ${F.body}`, color: 'rgba(245,241,236,.5)' }}>El correo no se puede cambiar — es tu acceso.</p>
                </div>
                <button onClick={cancelEdit} style={{ flexShrink: 0, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,.07)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(245,241,236,.7)" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
              </div>
              <div style={{ padding: '20px 28px 0' }}>
                {editForm(cancelEdit)}
              </div>
              <div style={{ height: 26 }} />
            </div>
          </div>
        )}
      </main>

      {/* ══ MOBILE ═════════════════════════════════════════════════════════════ */}
      <main className="ct-mobile" style={{ background: C.page, padding: '22px 16px 36px', minHeight: '100vh' }}>

        {editando ? (
          /* Mobile edit full-screen */
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <button onClick={cancelEdit} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
              </button>
              <span style={{ font: `600 14px/1 ${F.body}`, color: C.text }}>Editar mis datos</span>
            </div>
            <p style={{ margin: '0 0 18px', font: `400 12.5px/1.45 ${F.body}`, color: 'rgba(245,241,236,.5)' }}>El correo no se puede cambiar — es tu acceso.</p>
            {/* Mobile edit form has single-column fields */}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="hidden" name="estado" value="Nuevo León" />
              <input type="hidden" name="ciudad" value={ciudad} />
              <input type="hidden" name="numeroExterior" value="." />
              <FloatInput label="Nombre completo" name="full_name" value={fullName} onChange={setFullName} />
              <FloatInput label="WhatsApp" name="phone" type="tel" value={phone} onChange={setPhone} />
              <div style={{ margin: '8px 0 2px', font: `600 10px/1 ${F.body}`, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(245,241,236,.4)' }}>Dirección de entrega</div>
              <FloatInput label="Calle y número" name="calle" value={calle} onChange={setCalle} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FloatInput label="Interior" name="numeroInterior" value={numInt} onChange={setNumInt} placeholder="Opcional" />
                <FloatInput label="Colonia" name="colonia" value={colonia} onChange={setColonia} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12 }}>
                <FloatInput label="C.P." name="codigoPostal" value={cp} onChange={v => { const n = v.replace(/\D/g,''); if (n.length <= 5) setCp(n) }} />
                <FloatInput label="Ciudad" name="ciudadDisplay" value={ciudad} readOnly />
              </div>
              {formError && <p style={{ margin: 0, font: `400 12.5px/1 ${F.body}`, color: '#ff8080' }}>{formError}</p>}
              <div style={{ position: 'sticky', bottom: 0, display: 'flex', gap: 11, padding: '18px 0 22px', marginTop: 10, background: 'linear-gradient(180deg,rgba(15,13,12,0) 0%,#0f0d0c 40%)', borderTop: '1px solid rgba(255,255,255,.07)' }}>
                <button type="button" onClick={cancelEdit} style={{ flexShrink: 0, padding: '16px 20px', border: '1px solid rgba(255,255,255,.16)', borderRadius: 9, background: 'transparent', font: `600 13px/1 ${F.body}`, color: C.text, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={isPending} style={{ flex: 1, padding: '16px 0', border: 'none', borderRadius: 9, background: C.orange, color: C.onOrange, font: `700 18px/1 ${F.display}`, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer' }}>{isPending ? 'Guardando…' : 'Guardar cambios'}</button>
              </div>
            </form>
          </>
        ) : (
          /* Mobile main view */
          <>
            {/* Header */}
            <div style={{ font: `600 10.5px/1 ${F.body}`, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(245,241,236,.42)' }}>Mi cuenta</div>
            <h1 style={{ margin: '8px 0 6px', font: `700 36px/.94 ${F.display}`, textTransform: 'uppercase', color: C.text }}>
              {firstName} <span style={{ color: C.orange }}>{lastNameParts}</span>
            </h1>
            <div style={{ font: `400 12.5px/1 ${F.body}`, color: 'rgba(245,241,236,.5)' }}>{customer?.email ?? ''}</div>

            {/* Mobile membership band */}
            {mobileMembershipBand()}

            {/* Last order card */}
            <div style={{ marginTop: 16, background: C.card, border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, overflow: 'hidden' }}>
              {lastOrder ? (
                <>
                  <div style={{ padding: '16px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                      <span style={{ font: `600 10px/1 ${F.body}`, letterSpacing: '.16em', textTransform: 'uppercase', color: C.orange }}>Último pedido</span>
                      <StatusBadge status={lastOrder.status} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ font: `600 14.5px/1 ${F.body}`, color: C.text }}>{fmtDate(lastOrder.created_at)}</span>
                      <span style={{ font: `700 17px/1 ${F.display}`, color: C.text }}>{fmtAmt(lastOrder.total_amount)}</span>
                    </div>
                    {/* Items as prose */}
                    <div style={{ marginTop: 6, font: `400 12.5px/1.45 ${F.body}`, color: 'rgba(245,241,236,.55)' }}>
                      {chips.map(c => `${c.meal}${c.qty > 1 ? ` ×${c.qty}` : ''}`).join(', ')}
                      {chips.length > 0 && chips[0].size ? ` · todos ${chips[0].size}` : ''}
                    </div>
                    <a href="/reorder" className="ct-btn-orange" style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 15, padding: '15px 0', border: 'none', borderRadius: 9, background: C.orange, color: C.onOrange, font: `700 18px/1 ${F.display}`, letterSpacing: '.08em', textTransform: 'uppercase', textDecoration: 'none', textAlign: 'center' }}>Volver a pedir →</a>
                  </div>
                  <Link href="/cuenta/pedidos" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,.07)', font: `600 12.5px/1 ${F.body}`, color: C.orange, textDecoration: 'none' }}>
                    Ver mis {orderCount} pedidos <span>→</span>
                  </Link>
                </>
              ) : (
                <div style={{ padding: '32px 18px', textAlign: 'center' }}>
                  <div style={{ font: `700 20px/1 ${F.display}`, textTransform: 'uppercase', color: C.text }}>Todavia no tienes pedidos</div>
                  <Link href="/menu" style={{ display: 'inline-block', marginTop: 14, font: `600 13px/1 ${F.body}`, color: C.orange, textDecoration: 'none' }}>Ver el menú →</Link>
                </div>
              )}
            </div>

            {/* Mis datos (mobile) */}
            <div style={{ marginTop: 16, background: C.card, border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ font: `700 17px/1 ${F.display}`, letterSpacing: '.02em', textTransform: 'uppercase', color: C.text }}>Mis datos</span>
                <button onClick={openEdit} style={{ background: 'none', border: 'none', font: `600 12px/1 ${F.body}`, color: C.orange, cursor: 'pointer', padding: 0 }}>Editar</button>
              </div>
              <div style={{ font: `500 13.5px/1.5 ${F.body}`, color: C.text }}>
                {customer?.phone ?? <span style={{ color: 'rgba(245,241,236,.45)' }}>Sin teléfono</span>}
                {hasAddress && <><br /><span style={{ fontWeight: 400, color: 'rgba(245,241,236,.55)' }}>{addrParsed.calle}{addrParsed.colonia ? `, Col. ${addrParsed.colonia}` : ''}, C.P. {addrParsed.cp} · {addrParsed.ciudad}, N.L.</span></>}
                {!hasAddress && <><br /><span style={{ fontWeight: 400, color: 'rgba(245,241,236,.45)' }}>Sin dirección guardada — la pides en tu primer pedido.</span></>}
              </div>
            </div>

            {/* Referido (mobile) */}
            {referralCode && (
              <div id="invitar" style={{ marginTop: 16, background: C.card, border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: 18 }}>
                <div style={{ font: `700 17px/1 ${F.display}`, letterSpacing: '.02em', textTransform: 'uppercase', color: C.text }}>Invita y ganan los dos</div>
                <p style={{ margin: '8px 0 14px', font: `400 12.5px/1.45 ${F.body}`, color: 'rgba(245,241,236,.6)' }}>Tu amigo recibe 10% off en su primer pedido y tú otro 10% en el siguiente.</p>
                <div style={{ display: 'flex', alignItems: 'stretch', gap: 9 }}>
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', padding: '10px 14px', border: '1px dashed rgba(247,145,56,.45)', borderRadius: 8, background: 'rgba(247,145,56,.06)', font: `700 14px/1 ${F.cond}`, letterSpacing: '.12em', textTransform: 'uppercase', color: C.orange }}>
                    {referralCode.toUpperCase()}
                  </span>
                  <button className="ct-btn-orange" onClick={handleCopy} style={{ flexShrink: 0, padding: '0 16px', border: 'none', borderRadius: 8, background: C.orange, color: C.onOrange, font: `700 13px/1 ${F.body}`, cursor: 'pointer' }}>
                    {copied ? 'Copiado ✓' : 'Copiar'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  )
}
