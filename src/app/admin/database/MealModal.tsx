'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import type { Meal, Recipe } from '@/lib/types'
import { colors } from '@/lib/theme'
import { createMeal, updateMealFull, uploadMealImage } from '@/app/actions/database'

function RecipeCombobox({
  value,
  onChange,
  recipes,
}: {
  value: string
  onChange: (id: string) => void
  recipes: Recipe[]
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const selected = recipes.find((r) => r.id === value)
  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={open ? search : (selected?.name ?? '')}
        placeholder="Buscar receta principal…"
        onFocus={() => { setOpen(true); setSearch('') }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          background: colors.black,
          border: `1px solid ${colors.grayLight}`,
          borderRadius: 8,
          padding: '8px 12px',
          color: colors.white,
          fontSize: 14,
          boxSizing: 'border-box',
          outline: open ? `2px solid ${colors.orange}` : 'none',
        }}
      />
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: colors.grayDark, border: `1px solid ${colors.grayLight}`,
          borderRadius: 8, zIndex: 200, maxHeight: 200, overflowY: 'auto',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '10px 12px', color: colors.textMuted, fontSize: 13 }}>Sin resultados</div>
          ) : (
            filtered.map((r) => (
              <div
                key={r.id}
                onMouseDown={() => { onChange(r.id); setOpen(false) }}
                style={{
                  padding: '8px 14px', cursor: 'pointer', fontSize: 13,
                  color: r.id === value ? colors.orange : colors.white,
                  background: r.id === value ? colors.orange + '15' : 'transparent',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = colors.grayLight)}
                onMouseLeave={(e) => (e.currentTarget.style.background = r.id === value ? colors.orange + '15' : 'transparent')}
              >
                {r.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

interface MealModalProps {
  meal?: Meal
  mainRecipes: Recipe[]
  subRecipes: Recipe[]
  onClose: () => void
  onSaved: (updated: Meal) => void
}

export default function MealModal({ meal, mainRecipes, subRecipes, onClose, onSaved }: MealModalProps) {
  const [mainRecipeId, setMainRecipeId] = useState(meal?.main_recipe_id ?? '')
  const [selectedSubs, setSelectedSubs] = useState<Set<string>>(new Set(meal?.sub_recipe_ids ?? []))
  const [description, setDescription] = useState(meal?.description ?? '')
  const [imgUrl, setImgUrl] = useState(meal?.img ?? '')
  const [preview, setPreview] = useState(meal?.img ?? '')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [saving, startSave] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const isEdit = !!meal
  const selectedMain = mainRecipes.find((r) => r.id === mainRecipeId)

  function toggleSub(id: string) {
    setSelectedSubs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))

    if (isEdit) {
      setUploading(true)
      setError('')
      try {
        const fd = new FormData()
        fd.append('file', file)
        const result = await uploadMealImage(meal.id, fd)
        if (result.error) { setError(`Error al subir imagen: ${result.error}`); return }
        setImgUrl(result.publicUrl!)
      } catch (e) {
        setError(`Error al subir imagen: ${e instanceof Error ? e.message : 'Error desconocido'}`)
      } finally {
        setUploading(false)
      }
    } else {
      setPendingFile(file)
    }
  }

  function handleSave() {
    if (!mainRecipeId) return setError('Selecciona una receta principal')
    setError('')
    startSave(async () => {
      if (isEdit) {
        const result = await updateMealFull(meal.id, {
          mainRecipeId,
          subRecipeIds: [...selectedSubs],
          description: description.trim() || null,
          img: imgUrl || null,
        })
        if (result.error) { setError(result.error); return }
        onSaved({ ...meal, name: selectedMain?.name ?? meal.name, main_recipe_id: mainRecipeId, sub_recipe_ids: [...selectedSubs], description: description.trim() || null, img: imgUrl || null })
      } else {
        const result = await createMeal(mainRecipeId, [...selectedSubs])
        if (result.error) { setError(result.error); return }
        const newId = result.id!

        let finalImg: string | null = null
        if (pendingFile) {
          setUploading(true)
          const fd = new FormData()
          fd.append('file', pendingFile)
          const imgResult = await uploadMealImage(newId, fd)
          setUploading(false)
          if (imgResult.error) { setError(`Platillo creado pero error al subir imagen: ${imgResult.error}`); return }
          await updateMealFull(newId, { mainRecipeId, subRecipeIds: [...selectedSubs], description: description.trim() || null, img: imgResult.publicUrl! })
          finalImg = imgResult.publicUrl!
        }

        onSaved({ id: newId, name: selectedMain?.name ?? '', main_recipe_id: mainRecipeId, sub_recipe_ids: [...selectedSubs], description: description.trim() || null, img: finalImg, active: false, created_at: new Date().toISOString() })
      }
      onClose()
    })
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: colors.black, border: `1px solid ${colors.grayLight}`, borderRadius: 8, padding: '8px 12px', color: colors.white, fontSize: 14, boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { color: colors.textMuted, fontSize: 12, marginBottom: 6, display: 'block' }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: '#000000bb', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: colors.grayDark, borderRadius: 12, padding: 28, width: '100%', maxWidth: 520, border: `1px solid ${colors.grayLight}`, maxHeight: '92vh', overflowY: 'auto' }}>
        <h3 style={{ color: colors.white, fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
          {isEdit ? 'Editar platillo' : 'Nuevo platillo'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Receta principal */}
          <div>
            <label style={labelStyle}>Receta principal</label>
            <RecipeCombobox value={mainRecipeId} onChange={setMainRecipeId} recipes={mainRecipes} />
            {selectedMain && (
              <p style={{ color: colors.textMuted, fontSize: 12, marginTop: 6 }}>
                Nombre del platillo: <strong style={{ color: colors.white }}>{selectedMain.name}</strong>
              </p>
            )}
          </div>

          {/* Sub-recetas */}
          {subRecipes.length > 0 && (
            <div>
              <label style={labelStyle}>Sub-recetas (opcional)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {subRecipes.map((r) => (
                  <label
                    key={r.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 10px', borderRadius: 8, background: selectedSubs.has(r.id) ? colors.orange + '15' : 'transparent' }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubs.has(r.id)}
                      onChange={() => toggleSub(r.id)}
                      style={{ accentColor: colors.orange, width: 16, height: 16 }}
                    />
                    <span style={{ color: colors.white, fontSize: 13 }}>{r.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Descripción */}
          <div>
            <label style={labelStyle}>Descripción</label>
            <textarea
              style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
            />
          </div>

          {/* Imagen */}
          <div>
            <label style={labelStyle}>Imagen</label>
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Preview" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, marginBottom: 10, display: 'block' }} />
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{ padding: '6px 16px', borderRadius: 8, border: `1px solid ${colors.grayLight}`, background: 'transparent', color: colors.white, cursor: 'pointer', fontSize: 13 }}
            >
              {uploading ? 'Subiendo…' : preview ? 'Cambiar imagen' : 'Subir imagen'}
            </button>
          </div>
        </div>

        {error && <p style={{ color: colors.error, fontSize: 13, marginTop: 16 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 8, border: `1px solid ${colors.grayLight}`, background: 'transparent', color: colors.textMuted, cursor: 'pointer', fontSize: 14 }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving || uploading} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: colors.orange, color: colors.white, cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Guardando…' : isEdit ? 'Guardar' : 'Crear platillo'}
          </button>
        </div>
      </div>
    </div>
  )
}
