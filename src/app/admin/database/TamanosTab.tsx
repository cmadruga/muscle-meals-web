'use client'

import { useState, useTransition } from 'react'
import type { Ingredient } from '@/lib/types'
import type { SizeAdmin } from '@/app/actions/database'
import { updateSizePortions } from '@/app/actions/database'
import { CARB_BASE, PROTEIN_BASE } from '@/lib/utils/pricing'
import { colors } from '@/lib/theme'

const inputStyle: React.CSSProperties = {
  width: 70,
  background: '#111',
  border: `1px solid ${colors.grayLight}`,
  borderRadius: 6,
  padding: '6px 8px',
  color: colors.white,
  fontSize: 13,
  textAlign: 'center',
  outline: 'none',
}

function IngRow({ name, value, onChange, accent }: {
  name: string; value: string; onChange: (v: string) => void; accent: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid #1e1e1e` }}>
      <span style={{ color: colors.textSecondary, fontSize: 13 }}>{name}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <input
          type="number" min={0} value={value} onChange={e => onChange(e.target.value)}
          style={{ ...inputStyle, borderColor: value ? accent + '55' : colors.grayLight }}
        />
        <span style={{ color: colors.textMuted, fontSize: 11, width: 10 }}>g</span>
      </div>
    </div>
  )
}

function SizeCard({
  size,
  proIngredients,
  carbIngredients,
  defaultOpen,
}: {
  size: SizeAdmin
  proIngredients: Ingredient[]
  carbIngredients: Ingredient[]
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [proQtys, setProQtys] = useState<Record<string, string>>(() =>
    Object.fromEntries(proIngredients.map(i => [i.id, String(size.protein_qty[i.id] ?? '')]))
  )
  const [carbQtys, setCarbQtys] = useState<Record<string, string>>(() =>
    Object.fromEntries(carbIngredients.map(i => [i.id, String(size.carb_qty[i.id] ?? '')]))
  )
  const [vegQty, setVegQty] = useState(String(size.veg_qty ?? ''))
  const [pending, start] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function save() {
    setError('')
    const proteinQty: Record<string, number> = {}
    for (const [id, v] of Object.entries(proQtys)) {
      const n = parseFloat(v); if (n > 0) proteinQty[id] = n
    }
    const carbQty: Record<string, number> = {}
    for (const [id, v] of Object.entries(carbQtys)) {
      const n = parseFloat(v); if (n > 0) carbQty[id] = n
    }
    start(async () => {
      const res = await updateSizePortions(size.id, proteinQty, carbQty, parseFloat(vegQty) || 0)
      if (res.error) { setError(res.error); return }
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    })
  }

  const badge = size.is_main
    ? <span style={{ background: colors.orange + '22', color: colors.orange, border: `1px solid ${colors.orange}44`, borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>Main</span>
    : <span style={{ background: '#33333388', color: colors.textMuted, border: `1px solid ${colors.grayLight}`, borderRadius: 5, padding: '2px 8px', fontSize: 11 }}>Custom</span>

  return (
    <div style={{ border: `1px solid ${colors.grayLight}`, borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
      {/* Header / toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px',
          background: colors.grayDark, border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ color: open ? colors.white : colors.textSecondary, fontWeight: 700, fontSize: 15, flex: 1 }}>
          {size.name}
        </span>
        {badge}
        <span style={{ color: colors.textMuted, fontSize: 13, marginLeft: 4 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', borderTop: `1px solid ${colors.grayLight}` }}>
            {/* Proteína */}
            <div style={{ padding: '14px 18px', borderRight: `1px solid ${colors.grayLight}` }}>
              <p style={{ color: '#ef4444', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 8px' }}>Proteína</p>
              {proIngredients.map(ing => (
                <IngRow key={ing.id} name={ing.name} value={proQtys[ing.id] ?? ''}
                  onChange={v => setProQtys(p => {
                    const n = { ...p }
                    n[ing.id] = v
                    const key = ing.public_name ?? ing.name
                    proIngredients.filter(i => (i.public_name ?? i.name) === key && i.id !== ing.id).forEach(i => { n[i.id] = v })
                    return n
                  })} accent="#ef4444" />
              ))}
              {proIngredients.length === 0 && <p style={{ color: colors.textMuted, fontSize: 12 }}>Sin ingredientes</p>}
            </div>

            {/* Carbo */}
            <div style={{ padding: '14px 18px', borderRight: `1px solid ${colors.grayLight}` }}>
              <p style={{ color: '#eab308', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 8px' }}>Carbo</p>
              {carbIngredients.map(ing => (
                <IngRow key={ing.id} name={ing.name} value={carbQtys[ing.id] ?? ''}
                  onChange={v => setCarbQtys(p => {
                    const n = { ...p }
                    n[ing.id] = v
                    const key = ing.public_name ?? ing.name
                    carbIngredients.filter(i => (i.public_name ?? i.name) === key && i.id !== ing.id).forEach(i => { n[i.id] = v })
                    return n
                  })} accent="#eab308" />
              ))}
              {carbIngredients.length === 0 && <p style={{ color: colors.textMuted, fontSize: 12 }}>Sin ingredientes</p>}
            </div>

            {/* Verdura */}
            <div style={{ padding: '14px 18px', minWidth: 130 }}>
              <p style={{ color: '#22c55e', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 8px' }}>Verdura</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <input type="number" min={0} value={vegQty} onChange={e => setVegQty(e.target.value)}
                  style={{ ...inputStyle, borderColor: vegQty ? '#22c55e55' : colors.grayLight }} />
                <span style={{ color: colors.textMuted, fontSize: 11 }}>g</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '10px 18px', background: '#0d0d0d', borderTop: `1px solid ${colors.grayLight}` }}>
            {error && <span style={{ color: colors.error, fontSize: 12 }}>{error}</span>}
            {saved && <span style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}>✓ Guardado</span>}
            <button
              onClick={save} disabled={pending}
              style={{ padding: '6px 18px', borderRadius: 6, border: 'none', cursor: pending ? 'not-allowed' : 'pointer', background: colors.orange, color: colors.white, fontWeight: 600, fontSize: 13, opacity: pending ? 0.7 : 1 }}
            >
              {pending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Validación de proporciones ───────────────────────────────────────────────

function fmt1(n: number) { return (Math.round(n * 10) / 10).toString() }

type RatioRow = { ing: Ingredient; rLow: number; rFit: number; rPlus: number; ok: boolean }

function buildRatioRows(
  ingredients: Ingredient[],
  getQty: (size: SizeAdmin, ingId: string) => number,
  base: { LOW: number; FIT: number; PLUS: number },
  low: SizeAdmin, fit: SizeAdmin, plus: SizeAdmin,
): RatioRow[] {
  return ingredients.map(ing => {
    const rLow  = base.LOW  > 0 ? getQty(low,  ing.id) / base.LOW  : 0
    const rFit  = base.FIT  > 0 ? getQty(fit,  ing.id) / base.FIT  : 0
    const rPlus = base.PLUS > 0 ? getQty(plus, ing.id) / base.PLUS : 0
    const ok = rLow > 0 && rFit > 0 && rPlus > 0
      && Math.abs(rLow - rFit) / rFit < 0.02
      && Math.abs(rPlus - rFit) / rFit < 0.02
    return { ing, rLow, rFit, rPlus, ok }
  })
}

function RatioTable({ rows, getQty, base, low, fit, plus, accent }: {
  rows: RatioRow[]
  getQty: (size: SizeAdmin, ingId: string) => number
  base: { LOW: number; FIT: number; PLUS: number }
  low: SizeAdmin; fit: SizeAdmin; plus: SizeAdmin
  accent: string
}) {
  if (rows.length === 0) return null
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${colors.grayLight}` }}>
          <th style={{ padding: '7px 14px', textAlign: 'left', color: colors.textMuted, fontWeight: 600 }}>Ingrediente</th>
          <th style={{ padding: '7px 12px', textAlign: 'center', color: colors.textMuted, fontWeight: 600 }}>LOW ({base.LOW}g base)</th>
          <th style={{ padding: '7px 12px', textAlign: 'center', color: colors.textMuted, fontWeight: 600 }}>FIT ({base.FIT}g base)</th>
          <th style={{ padding: '7px 12px', textAlign: 'center', color: colors.textMuted, fontWeight: 600 }}>PLUS ({base.PLUS}g base)</th>
          <th style={{ padding: '7px 12px', textAlign: 'center', color: colors.textMuted, fontWeight: 600 }}>Proporción</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ ing, rLow, rFit, rPlus, ok }) => (
          <tr key={ing.id} style={{ borderBottom: `1px solid #1a1a1a`, background: ok ? 'transparent' : '#ef444408' }}>
            <td style={{ padding: '7px 14px', color: ok ? colors.textSecondary : '#ef4444' }}>{ing.name}</td>
            <td style={{ padding: '7px 12px', textAlign: 'center', color: colors.white }}>
              {getQty(low, ing.id) || <span style={{ color: colors.textMuted }}>—</span>}
              {getQty(low, ing.id) > 0 && <span style={{ color: colors.textMuted, marginLeft: 4 }}>g</span>}
            </td>
            <td style={{ padding: '7px 12px', textAlign: 'center', color: colors.white }}>
              {getQty(fit, ing.id) || <span style={{ color: colors.textMuted }}>—</span>}
              {getQty(fit, ing.id) > 0 && <span style={{ color: colors.textMuted, marginLeft: 4 }}>g</span>}
            </td>
            <td style={{ padding: '7px 12px', textAlign: 'center', color: colors.white }}>
              {getQty(plus, ing.id) || <span style={{ color: colors.textMuted }}>—</span>}
              {getQty(plus, ing.id) > 0 && <span style={{ color: colors.textMuted, marginLeft: 4 }}>g</span>}
            </td>
            <td style={{ padding: '7px 12px', textAlign: 'center' }}>
              {ok
                ? <span style={{ color: accent, fontWeight: 700 }}>×{fmt1(rFit)}</span>
                : <span style={{ color: '#ef4444', fontWeight: 700 }}>⚠ ×{fmt1(rLow)} / ×{fmt1(rFit)} / ×{fmt1(rPlus)}</span>
              }
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function RatioCheck({ mainSizes, proIngredients, carbIngredients }: {
  mainSizes: SizeAdmin[]
  proIngredients: Ingredient[]
  carbIngredients: Ingredient[]
}) {
  const byName = new Map(mainSizes.map(s => [s.name.toUpperCase(), s]))
  const low  = byName.get('LOW')
  const fit  = byName.get('FIT')
  const plus = byName.get('PLUS')
  if (!low || !fit || !plus) return null

  const carbRows = buildRatioRows(
    carbIngredients,
    (s, id) => s.carb_qty[id] ?? 0,
    CARB_BASE, low, fit, plus,
  )
  const proRows = buildRatioRows(
    proIngredients,
    (s, id) => s.protein_qty[id] ?? 0,
    PROTEIN_BASE, low, fit, plus,
  )

  const allOk = [...carbRows, ...proRows].every(r => r.ok)

  return (
    <div style={{ border: `1px solid ${allOk ? '#22c55e33' : '#ef444433'}`, borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ background: allOk ? '#22c55e11' : '#ef444411', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: allOk ? '#22c55e' : '#ef4444' }}>
          {allOk ? '✓ Proporciones consistentes' : '⚠ Proporciones inconsistentes'}
        </span>
        <span style={{ fontSize: 12, color: colors.textMuted }}>
          — el ratio de cada ingrediente debe ser el mismo en LOW / FIT / PLUS
        </span>
      </div>

      {carbRows.length > 0 && (
        <>
          <div style={{ padding: '8px 14px 2px', background: '#0d0d0d', borderTop: `1px solid ${colors.grayLight}` }}>
            <span style={{ color: '#eab308', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Carbo</span>
          </div>
          <RatioTable rows={carbRows} getQty={(s, id) => s.carb_qty[id] ?? 0}
            base={CARB_BASE} low={low} fit={fit} plus={plus} accent="#eab308" />
        </>
      )}

      {proRows.length > 0 && (
        <>
          <div style={{ padding: '8px 14px 2px', background: '#0d0d0d', borderTop: `1px solid ${colors.grayLight}` }}>
            <span style={{ color: '#ef4444', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Proteína</span>
          </div>
          <RatioTable rows={proRows} getQty={(s, id) => s.protein_qty[id] ?? 0}
            base={PROTEIN_BASE} low={low} fit={fit} plus={plus} accent="#ef4444" />
        </>
      )}
    </div>
  )
}

// ─── Tab principal ─────────────────────────────────────────────────────────────

export default function TamanosTab({ sizes, ingredients }: { sizes: SizeAdmin[]; ingredients: Ingredient[] }) {
  const proIngredients = ingredients.filter(i => i.type === 'pro')
  const carbIngredients = ingredients.filter(i => i.type === 'carb')

  const mainSizes = sizes.filter(s => s.is_main)
  const customSizes = sizes.filter(s => !s.is_main)

  return (
    <div>
      <p style={{ color: colors.textMuted, fontSize: 13, marginBottom: 20 }}>
        Configura la porción de cada ingrediente por tamaño. Estos valores se usan para macros, producción y pinche.
      </p>

      {mainSizes.length > 0 && (
        <>
          <p style={{ color: colors.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Tamaños main</p>
          {mainSizes.map(s => (
            <SizeCard key={s.id} size={s} proIngredients={proIngredients} carbIngredients={carbIngredients} defaultOpen={true} />
          ))}
          <RatioCheck mainSizes={mainSizes} proIngredients={proIngredients} carbIngredients={carbIngredients} />
        </>
      )}

      {customSizes.length > 0 && (
        <>
          <p style={{ color: colors.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '20px 0 8px' }}>Tamaños personalizados</p>
          {customSizes.map(s => (
            <SizeCard key={s.id} size={s} proIngredients={proIngredients} carbIngredients={carbIngredients} defaultOpen={false} />
          ))}
        </>
      )}

      {sizes.length === 0 && (
        <p style={{ color: colors.textMuted, fontSize: 14 }}>Sin tamaños configurados.</p>
      )}
    </div>
  )
}
