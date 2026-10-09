'use client'

import { useState, useEffect, useRef } from 'react'
import { colors } from '@/lib/theme'
import type { WaConversation, WaMessage } from '@/lib/db/whatsapp'
import {
  getWaConversations,
  getWaMessages,
  markWaConversationRead,
  sendWaReply,
  sendWaTemplateSingle,
  createWaConvAndSendTemplate,
  getCustomersForWa,
  type CustomerForWa,
} from '@/app/actions/whatsapp-inbox'
import { listTemplateImages, sendReorderBroadcast, uploadTemplateImage } from '@/app/actions/whatsapp'

type TemplateImage = { name: string; url: string }

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000

const TEMPLATES = [
  { id: 'reordenar', label: 'Reordenar', description: 'Invita al cliente a repetir su pedido', hasImage: true },
]

function formatTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const diffH = (Date.now() - d.getTime()) / 3600000
  if (diffH < 24) return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  if (diffH < 48) return 'Ayer'
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

function is24hOpen(messages: WaMessage[]): boolean {
  const last = [...messages].reverse().find(m => m.direction === 'in')
  if (!last) return false
  return Date.now() - new Date(last.sent_at).getTime() < 86400000
}

function timeLeft(messages: WaMessage[]): string {
  const last = [...messages].reverse().find(m => m.direction === 'in')
  if (!last) return ''
  const ms = 86400000 - (Date.now() - new Date(last.sent_at).getTime())
  if (ms <= 0) return ''
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// ─── TemplateImagePicker ──────────────────────────────────────────────────────
function TemplateImagePicker({ selected, onSelect }: { selected: string | null; onSelect: (url: string) => void }) {
  const [images, setImages] = useState<TemplateImage[]>([])
  const [loading, setLoading] = useState(true)
  const [addingNew, setAddingNew] = useState(false)
  const [uploadName, setUploadName] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listTemplateImages().then(list => {
      setImages(list)
      if (list.length > 0 && !selected) onSelect(list[0].url)
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUpload = async () => {
    if (!uploadFile || !uploadName.trim()) return
    setUploading(true)
    setUploadError(null)
    const fd = new FormData()
    fd.append('file', uploadFile)
    const res = await uploadTemplateImage(uploadName.trim(), fd)
    if (res.error) { setUploadError(res.error); setUploading(false); return }
    if (res.url) {
      setImages(prev => [...prev, { name: uploadName.trim(), url: res.url! }])
      onSelect(res.url)
      setAddingNew(false)
      setUploadName('')
      setUploadFile(null)
      if (fileRef.current) fileRef.current.value = ''
    }
    setUploading(false)
  }

  if (loading) return <div style={{ fontSize: 13, color: colors.textMuted }}>Cargando imágenes…</div>

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: addingNew ? 12 : 0 }}>
        {images.map(img => (
          <button key={img.url} onClick={() => { onSelect(img.url); setAddingNew(false) }}
            style={{ padding: 0, border: `2px solid ${selected === img.url && !addingNew ? colors.orange : colors.grayLight}`, borderRadius: 8, cursor: 'pointer', background: 'transparent', overflow: 'hidden', aspectRatio: '1', position: 'relative' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            {selected === img.url && !addingNew && (
              <div style={{ position: 'absolute', top: 4, right: 4, background: colors.orange, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700 }}>✓</div>
            )}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.65)', padding: '3px 6px', fontSize: 10, color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{img.name}</div>
          </button>
        ))}
        <button onClick={() => { setAddingNew(true); setUploadError(null) }}
          style={{ border: `2px dashed ${addingNew ? colors.orange : colors.grayLight}`, borderRadius: 8, cursor: 'pointer', background: addingNew ? colors.orange + '11' : 'transparent', aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: addingNew ? colors.orange : colors.textMuted }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>+</span>
          <span style={{ fontSize: 11, fontWeight: 600 }}>Nueva</span>
        </button>
      </div>
      {addingNew && (
        <div style={{ padding: 14, background: colors.black + '88', border: `1px solid ${colors.grayLight}33`, borderRadius: 10 }}>
          <input placeholder="Nombre (ej: reorder-oct-2026)" value={uploadName} onChange={e => setUploadName(e.target.value)}
            style={{ width: '100%', padding: '7px 12px', marginBottom: 8, background: colors.black, border: `1px solid ${colors.grayLight}`, borderRadius: 7, color: colors.white, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input ref={fileRef} type="file" accept="image/*" onChange={e => setUploadFile(e.target.files?.[0] ?? null)} style={{ flex: 1, fontSize: 12, color: colors.textMuted }} />
            <button onClick={handleUpload} disabled={!uploadFile || !uploadName.trim() || uploading}
              style={{ padding: '7px 14px', background: colors.orange, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (!uploadFile || !uploadName.trim() || uploading) ? 0.5 : 1, whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
              {uploading ? 'Subiendo…' : 'Guardar'}
            </button>
          </div>
          {uploadError && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>{uploadError}</div>}
        </div>
      )}
    </>
  )
}

// ─── SingleTemplateModal ──────────────────────────────────────────────────────
function SingleTemplateModal({ convId, phone, name, onClose, onSent }: {
  convId: string; phone: string; name: string; onClose: () => void; onSent: () => void
}) {
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const currentTemplate = TEMPLATES.find(t => t.id === selectedTemplate)
  const canSend = !!selectedTemplate && (!currentTemplate?.hasImage || !!imageUrl)

  const handleSend = async () => {
    if (!canSend || sending) return
    setSending(true)
    setError(null)
    const res = await sendWaTemplateSingle(convId, phone, name.split(' ')[0], imageUrl ?? '')
    if (res.ok) {
      setSent(true)
      setTimeout(() => { onClose(); onSent() }, 1200)
    } else {
      setError(res.error ?? 'Error enviando')
      setSending(false)
    }
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 24 }}>
      <div style={{ background: colors.grayDark, border: `1px solid ${colors.grayLight}`, borderRadius: 12, width: '100%', maxWidth: 420, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${colors.grayLight}33`, flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: colors.white }}>Enviar plantilla</div>
            <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              {name} · <span style={{ color: '#25d366' }}>{phone}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 4 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Template</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {TEMPLATES.map(t => (
              <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, border: `1px solid ${selectedTemplate === t.id ? colors.orange : colors.grayLight}`, background: selectedTemplate === t.id ? colors.orange + '11' : 'transparent', cursor: 'pointer' }}>
                <input type="radio" name="single-template" value={t.id} checked={selectedTemplate === t.id} onChange={() => setSelectedTemplate(t.id)} style={{ accentColor: colors.orange, width: 15, height: 15 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: colors.white }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{t.description}</div>
                </div>
              </label>
            ))}
          </div>
          {currentTemplate?.hasImage && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Imagen del template</div>
              <TemplateImagePicker selected={imageUrl} onSelect={setImageUrl} />
            </>
          )}
        </div>
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${colors.grayLight}33`, flexShrink: 0 }}>
          {error && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 8 }}>{error}</div>}
          {sent && <div style={{ color: '#25d366', fontSize: 12, marginBottom: 8 }}>✅ Plantilla enviada</div>}
          <button onClick={handleSend} disabled={!canSend || sending || sent}
            style={{ width: '100%', padding: '10px 16px', background: !canSend || sending ? colors.grayLight : colors.orange, color: colors.white, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: !canSend || sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1, fontFamily: 'inherit' }}>
            {sending ? 'Enviando…' : sent ? '✅ Enviado' : 'Enviar plantilla →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── BroadcastModal — exact port of WhatsAppModal from CustomersClient ────────
function BroadcastModal({ customers, onClose }: { customers: CustomerForWa[]; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [images, setImages] = useState<TemplateImage[]>([])
  const [imagesLoading, setImagesLoading] = useState(true)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [uploadName, setUploadName] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const selectAllRef = useRef<HTMLInputElement>(null)

  const [selected, setSelected] = useState<Set<string>>(() => {
    const now = Date.now()
    return new Set(
      customers
        .filter(c => c.phone && c.last_order_at && now - new Date(c.last_order_at).getTime() < TWO_WEEKS_MS)
        .map(c => c.id)
    )
  })

  useEffect(() => {
    listTemplateImages().then(list => {
      setImages(list)
      if (list.length > 0) setSelectedImageUrl(list[0].url)
      setImagesLoading(false)
    })
  }, [])

  const currentTemplate = TEMPLATES.find(t => t.id === selectedTemplate)

  const handleUpload = async () => {
    if (!uploadFile || !uploadName.trim()) return
    setUploading(true)
    setUploadError(null)
    const fd = new FormData()
    fd.append('file', uploadFile)
    const res = await uploadTemplateImage(uploadName.trim(), fd)
    if (res.error) { setUploadError(res.error) }
    else if (res.url) {
      setImages(prev => [...prev, { name: uploadName.trim(), url: res.url! }])
      setSelectedImageUrl(res.url)
      setAddingNew(false)
      setUploadName('')
      setUploadFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    setUploading(false)
  }

  const q = search.toLowerCase()
  const visible = q
    ? customers.filter(c => c.full_name.toLowerCase().includes(q) || (c.phone ?? '').includes(q))
    : customers

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
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })
  const handleSelectAll = () => {
    if (allChecked) setSelected(prev => { const n = new Set(prev); visibleSelectable.forEach(c => n.delete(c.id)); return n })
    else setSelected(prev => { const n = new Set(prev); visibleSelectable.forEach(c => n.add(c.id)); return n })
  }

  const handleSend = async () => {
    const recipients = customers.filter(c => selected.has(c.id) && c.phone).map(c => ({ phone: c.phone!, firstName: c.full_name.split(' ')[0], fullName: c.full_name }))
    if (recipients.length === 0) return
    if (currentTemplate?.hasImage && !selectedImageUrl) return
    setSending(true); setResult(null)
    try {
      const { sent, failed } = await sendReorderBroadcast(recipients, selectedImageUrl!)
      const msg = failed === 0 ? `✅ ${sent} mensajes enviados correctamente` : `✅ ${sent} enviados · ❌ ${failed} fallaron`
      setResult(msg)
      setSending(false)
      setTimeout(onClose, 1500)
    } catch {
      setResult('❌ Error al enviar — revisa los logs del servidor')
      setSending(false)
    }
  }

  const canProceed = !!selectedTemplate && (!currentTemplate?.hasImage || (selectedImageUrl !== null && !addingNew))

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 24 }}>
      <div style={{ background: colors.grayDark, border: `1px solid ${colors.grayLight}`, borderRadius: 12, width: '100%', maxWidth: 480, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${colors.grayLight}33`, flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.white }}>Enviar WhatsApp</div>
            <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              Paso {step} de 2 — {step === 1 ? 'Seleccionar template e imagen' : `${selected.size} destinatarios`}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 4 }}>×</button>
        </div>

        {step === 1 && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Template</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {TEMPLATES.map(t => (
                <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, border: `1px solid ${selectedTemplate === t.id ? colors.orange : colors.grayLight}`, background: selectedTemplate === t.id ? colors.orange + '11' : 'transparent', cursor: 'pointer' }}>
                  <input type="radio" name="broadcast-template" value={t.id} checked={selectedTemplate === t.id} onChange={() => setSelectedTemplate(t.id)} style={{ accentColor: colors.orange, width: 15, height: 15 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: colors.white }}>{t.label}</div>
                    <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{t.description}</div>
                  </div>
                </label>
              ))}
            </div>
            {currentTemplate?.hasImage && (
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
                      <button onClick={() => { setAddingNew(true); setSelectedImageUrl(null); setUploadError(null) }} style={{ border: `2px dashed ${addingNew ? colors.orange : colors.grayLight}`, borderRadius: 8, cursor: 'pointer', background: addingNew ? colors.orange + '11' : 'transparent', aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: addingNew ? colors.orange : colors.textMuted }}>
                        <span style={{ fontSize: 22, lineHeight: 1 }}>+</span>
                        <span style={{ fontSize: 11, fontWeight: 600 }}>Nueva</span>
                      </button>
                    </div>
                    {addingNew && (
                      <div style={{ padding: 14, background: colors.black + '88', border: `1px solid ${colors.grayLight}33`, borderRadius: 10 }}>
                        <input placeholder="Nombre (ej: reorder-julio-2026)" value={uploadName} onChange={e => setUploadName(e.target.value)}
                          style={{ width: '100%', padding: '7px 12px', marginBottom: 8, background: colors.black, border: `1px solid ${colors.grayLight}`, borderRadius: 7, color: colors.white, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }} />
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input ref={fileInputRef} type="file" accept="image/*" onChange={e => setUploadFile(e.target.files?.[0] ?? null)} style={{ flex: 1, fontSize: 12, color: colors.textMuted }} />
                          <button onClick={handleUpload} disabled={!uploadFile || !uploadName.trim() || uploading}
                            style={{ padding: '7px 14px', background: colors.orange, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (!uploadFile || !uploadName.trim() || uploading) ? 0.5 : 1, whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
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

        {step === 2 && (
          <>
            <div style={{ padding: '12px 24px 12px', borderBottom: `1px solid ${colors.grayLight}33`, flexShrink: 0 }}>
              <input placeholder="Buscar por nombre o teléfono…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '7px 12px', marginBottom: 12, background: colors.black, border: `1px solid ${colors.grayLight}`, borderRadius: 7, color: colors.white, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }} />
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

        <div style={{ padding: '14px 24px', borderTop: `1px solid ${colors.grayLight}33`, flexShrink: 0 }}>
          {step === 2 && result && (
            <div style={{ padding: '8px 12px', marginBottom: 12, background: result.startsWith('✅') ? '#10b98118' : '#ef444418', border: `1px solid ${result.startsWith('✅') ? '#10b98144' : '#ef444444'}`, borderRadius: 8, fontSize: 13, color: colors.white }}>
              {result}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            {step === 2 && (
              <button onClick={() => { setResult(null); setStep(1) }} style={{ padding: '11px 16px', background: 'transparent', color: colors.textMuted, border: `1px solid ${colors.grayLight}`, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Atrás</button>
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

// ─── NewConvModal ─────────────────────────────────────────────────────────────
function NewConvModal({ customers, customersLoading, onClose, onCreated }: {
  customers: CustomerForWa[]; customersLoading: boolean; onClose: () => void; onCreated: (convId: string) => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<CustomerForWa | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const available = customers.filter(c => !!c.phone)
  const q = search.toLowerCase()
  const visible = q ? available.filter(c => c.full_name.toLowerCase().includes(q) || (c.phone ?? '').includes(q)) : available

  const handleSend = async () => {
    if (!selected?.phone || !imageUrl || sending) return
    setSending(true); setError(null)
    const res = await createWaConvAndSendTemplate(selected.phone, selected.full_name, selected.full_name.split(' ')[0], imageUrl)
    if (res.ok && res.convId) { onCreated(res.convId); onClose() }
    else { setError(res.error ?? 'Error'); setSending(false) }
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 24 }}>
      <div style={{ background: colors.grayDark, border: `1px solid ${colors.grayLight}`, borderRadius: 12, width: '100%', maxWidth: 420, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${colors.grayLight}33`, flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: colors.white }}>Nueva conversación</div>
            <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              {step === 1 ? `${available.length} clientes con teléfono` : `${selected?.full_name} · elige imagen`}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 4 }}>×</button>
        </div>

        {step === 1 && (
          <>
            <div style={{ padding: '12px 20px', borderBottom: `1px solid ${colors.grayLight}33`, flexShrink: 0 }}>
              <input autoFocus placeholder="Buscar cliente…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', background: colors.black, border: `1px solid ${colors.grayLight}`, borderRadius: 7, color: colors.white, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px' }}>
              {customersLoading ? <div style={{ padding: '16px 0', color: colors.textMuted, fontSize: 13 }}>Cargando…</div>
                : visible.length === 0 ? (
                  <div style={{ padding: '32px 0', color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>
                    {search ? 'Sin resultados' : 'Sin clientes con teléfono'}
                  </div>
                ) : visible.map((c, i) => (
                  <div key={c.id} onClick={() => { setSelected(c); setStep(2) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', cursor: 'pointer', borderBottom: i < visible.length - 1 ? `1px solid ${colors.grayLight}22` : 'none' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: colors.white, fontWeight: 500 }}>{c.full_name}</div>
                      <div style={{ fontSize: 11, color: '#25d366', marginTop: 1 }}>{c.phone}</div>
                    </div>
                    <span style={{ color: colors.textMuted, fontSize: 14 }}>→</span>
                  </div>
                ))}
            </div>
          </>
        )}

        {step === 2 && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Template: Reordenar · Imagen</div>
            <TemplateImagePicker selected={imageUrl} onSelect={setImageUrl} />
          </div>
        )}

        <div style={{ padding: '12px 20px', borderTop: `1px solid ${colors.grayLight}33`, flexShrink: 0 }}>
          {error && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 8 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            {step === 2 && (
              <button onClick={() => setStep(1)}
                style={{ padding: '10px 16px', background: 'transparent', color: colors.textMuted, border: `1px solid ${colors.grayLight}`, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Atrás</button>
            )}
            {step === 2 && (
              <button onClick={handleSend} disabled={!imageUrl || sending}
                style={{ flex: 1, padding: '10px 20px', background: imageUrl ? colors.orange : colors.grayLight, color: colors.white, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: !imageUrl || sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1, fontFamily: 'inherit' }}>
                {sending ? 'Enviando…' : 'Enviar plantilla →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function InboxClient({ initial }: { initial: WaConversation[] }) {
  const [conversations, setConversations] = useState<WaConversation[]>(initial)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<WaMessage[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [templateTarget, setTemplateTarget] = useState<{ convId: string; phone: string; name: string } | null>(null)
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [showNewConv, setShowNewConv] = useState(false)
  const [customers, setCustomers] = useState<CustomerForWa[]>([])
  const [customersLoading, setCustomersLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const selectedConv = conversations.find(c => c.id === selectedId) ?? null
  const windowOpen = is24hOpen(messages)
  const remaining = timeLeft(messages)

  const convDisplayName = (conv: WaConversation) =>
    conv.customer_name ?? conv.contact_phone

  const filteredConvs = searchQuery
    ? conversations.filter(c =>
        convDisplayName(c).toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contact_phone.includes(searchQuery)
      )
    : conversations

  useEffect(() => {
    getCustomersForWa().then(list => {
      setCustomers(list)
      setCustomersLoading(false)
    })
  }, [])

  useEffect(() => {
    const t = setInterval(async () => {
      const convs = await getWaConversations()
      setConversations(convs)
    }, 8000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setLoadingMsgs(true)
    getWaMessages(selectedId).then(msgs => { setMessages(msgs); setLoadingMsgs(false) })
    markWaConversationRead(selectedId)
    setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, unread_count: 0 } : c))
  }, [selectedId])

  useEffect(() => {
    if (!selectedId) return
    const t = setInterval(async () => {
      const msgs = await getWaMessages(selectedId)
      setMessages(msgs)
    }, 5000)
    return () => clearInterval(t)
  }, [selectedId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!selectedId || !selectedConv || !reply.trim() || sending) return
    setSending(true)
    const text = reply.trim()
    setReply('')
    const result = await sendWaReply(selectedId, selectedConv.contact_phone, text)
    if (!result.ok) setReply(text)
    const msgs = await getWaMessages(selectedId)
    setMessages(msgs)
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const refreshConvs = async () => { setConversations(await getWaConversations()) }
  const refreshMsgs = async () => { if (selectedId) setMessages(await getWaMessages(selectedId)) }

  const customerHref = (conv: WaConversation) =>
    conv.customer_id ? `/admin/customers?id=${conv.customer_id}` : `/admin/customers`

  const openTemplate = (conv: WaConversation) =>
    setTemplateTarget({ convId: conv.id, phone: conv.contact_phone, name: convDisplayName(conv) })

  const C = colors

  return (
    <div className="wa-outer" style={{ display: 'flex', height: '100vh', margin: '-32px', overflow: 'hidden' }}>
      <style>{`
        .wa-conv-item { cursor: pointer; padding: 10px 14px; border-bottom: 1px solid #ffffff08; transition: background 0.1s; }
        .wa-conv-item:hover { background: #ffffff08; }
        .wa-conv-item.active { background: ${C.orange}18; }
        .wa-msg-bubble { max-width: 72%; padding: 8px 12px; border-radius: 12px; font-size: 14px; line-height: 1.45; word-break: break-word; white-space: pre-wrap; }
        .wa-msg-in  { background: #2a2a2a; color: ${C.white}; align-self: flex-start; border-bottom-left-radius: 3px; }
        .wa-msg-out { background: ${C.orange}22; color: ${C.white}; align-self: flex-end; border-bottom-right-radius: 3px; }
        .wa-reply-area { background: transparent; border: none; color: ${C.white}; font-size: 15px; font-family: inherit; resize: none; padding: 12px 14px; width: 100%; outline: none; }
        .wa-icon-btn { background: transparent; border: none; cursor: pointer; color: ${C.textMuted}; padding: 4px; border-radius: 5px; display: flex; align-items: center; justify-content: center; transition: background 0.1s, color 0.1s; flex-shrink: 0; line-height: 1; }
        .wa-icon-btn:hover { background: #ffffff18; color: ${C.white}; }
        .wa-back-btn { display: none; }
        @media (max-width: 768px) {
          .wa-outer { margin: -16px !important; height: calc(100vh - 52px) !important; }
          .wa-sidebar { width: 100% !important; }
          .wa-sidebar.wa-has-sel { display: none !important; }
          .wa-detail { display: none !important; width: 100% !important; }
          .wa-detail.wa-has-sel { display: flex !important; }
          .wa-back-btn { display: flex !important; }
        }
      `}</style>

      {/* Sidebar */}
      <div className={`wa-sidebar${selectedId ? ' wa-has-sel' : ''}`} style={{ width: 290, flexShrink: 0, background: '#141414', borderRight: '1px solid #ffffff10', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid #ffffff10', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ color: C.white, fontWeight: 700, fontSize: 14, flex: 1 }}>WhatsApp</span>
            <button onClick={() => setShowNewConv(true)} className="wa-icon-btn" title="Nueva conversación">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
            </button>
            <button onClick={() => setShowBroadcast(true)} className="wa-icon-btn" title="Enviar WhatsApp" style={{ color: C.orange }}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1.5 4h13M1.5 8h9M1.5 12h6" /><path d="M12.5 10.5l3 1.5-3 1.5" />
              </svg>
            </button>
          </div>
          <input placeholder="Buscar nombre o número…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '7px 10px', background: '#1e1e1e', border: '1px solid #333', borderRadius: 7, color: C.white, fontSize: 12, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredConvs.length === 0 ? (
            <div style={{ padding: 24, color: C.textMuted, fontSize: 13, textAlign: 'center' }}>
              {searchQuery ? 'Sin resultados' : 'Sin mensajes entrantes'}
            </div>
          ) : filteredConvs.map(conv => (
            <div key={conv.id} className={`wa-conv-item${selectedId === conv.id ? ' active' : ''}`} onClick={() => setSelectedId(conv.id)}>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, marginBottom: 2 }}>
                    <span style={{ color: C.white, fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {convDisplayName(conv)}
                    </span>
                    <span style={{ color: C.textMuted, fontSize: 10, flexShrink: 0 }}>{formatTime(conv.last_message_at)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: C.textMuted, fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.contact_phone}
                    </span>
                    {conv.unread_count > 0 && (
                      <span style={{ background: '#25d366', color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 5px', flexShrink: 0 }}>
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Thread */}
      <div className={`wa-detail${selectedId ? ' wa-has-sel' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selectedConv ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.textMuted, gap: 8 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <span style={{ fontSize: 13 }}>Selecciona una conversación</span>
          </div>
        ) : (
          <>
            {/* Thread header — name + phone + customer link only, no tags */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #ffffff10', display: 'flex', alignItems: 'center', gap: 10, background: '#141414', flexShrink: 0 }}>
              <button
                className="wa-back-btn wa-icon-btn"
                onClick={() => setSelectedId(null)}
                style={{ padding: '6px 8px', gap: 4, fontSize: 13, color: C.orange }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 3L5 8l5 5" />
                </svg>
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: C.white, fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {convDisplayName(selectedConv)}
                  </span>
                  <a href={customerHref(selectedConv)} className="wa-icon-btn" title="Ver cliente" style={{ textDecoration: 'none', flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="8" cy="5.5" r="2.5" /><path d="M2.5 14c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5" />
                    </svg>
                  </a>
                </div>
                <div style={{ color: C.textMuted, fontSize: 12 }}>{selectedConv.contact_phone}</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {loadingMsgs ? (
                <div style={{ color: C.textMuted, fontSize: 13, textAlign: 'center', marginTop: 40 }}>Cargando...</div>
              ) : messages.length === 0 ? (
                <div style={{ color: C.textMuted, fontSize: 13, textAlign: 'center', marginTop: 40 }}>Sin mensajes</div>
              ) : messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.direction === 'out' ? 'flex-end' : 'flex-start' }}>
                  <div className={`wa-msg-bubble wa-msg-${msg.direction}`}>{msg.body}</div>
                  <span style={{ color: C.textMuted, fontSize: 10, marginTop: 2, paddingInline: 4 }}>
                    {new Date(msg.sent_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply area */}
            <div style={{ background: '#141414', flexShrink: 0 }}>
              {/* Status bar */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px',
                borderTop: `1px solid ${windowOpen ? '#ffffff10' : '#f59e0b22'}`,
                background: windowOpen ? 'transparent' : '#f59e0b08',
              }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke={windowOpen ? C.textMuted : '#f59e0b'} strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="8" cy="8" r="6" /><path d="M8 5v3.5l2 1" />
                </svg>
                <span style={{ fontSize: 12, color: windowOpen ? C.textMuted : '#f59e0b' }}>
                  {windowOpen
                    ? `Ventana de conversación abierta${remaining ? ` (${remaining} restantes)` : ''}`
                    : 'Ventana de 24h cerrada — solo plantillas'}
                </span>
              </div>

              {windowOpen ? (
                <div style={{ margin: '10px 16px 0', border: '1px solid #333', borderRadius: 10, overflow: 'hidden' }}>
                  <textarea
                    className="wa-reply-area"
                    rows={3}
                    placeholder="Escribe un mensaje…"
                    disabled={sending}
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderTop: '1px solid #333' }}>
                    <button
                      onClick={() => openTemplate(selectedConv)}
                      title="Enviar plantilla"
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 8px', borderRadius: 6, fontSize: 12, background: 'transparent', border: 'none', color: C.orange, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="12" height="12" rx="2" />
                        <path d="M5 6h6M5 9h4" />
                      </svg>
                      Enviar plantilla
                    </button>
                    <button
                      disabled={!reply.trim() || sending}
                      onClick={handleSend}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 16px', borderRadius: 7, border: 'none',
                        background: !reply.trim() || sending ? '#333' : C.orange,
                        color: !reply.trim() || sending ? C.textMuted : '#17140f',
                        fontSize: 13, fontWeight: 700,
                        cursor: !reply.trim() || sending ? 'not-allowed' : 'pointer',
                        opacity: sending ? 0.7 : 1, fontFamily: 'inherit',
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2L2 6.5l5 2 2 5L14 2z" />
                      </svg>
                      {sending ? '…' : 'Enviar'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ margin: '10px 16px 0', border: '1px solid #333', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
                  <span style={{ flex: 1, fontSize: 14, color: C.textMuted }}>Ventana de 24h cerrada — envía una plantilla para reabrirla</span>
                  <button
                    onClick={() => openTemplate(selectedConv)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                      padding: '8px 16px', background: C.orange, border: 'none', borderRadius: 8,
                      color: '#17140f', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="12" height="12" rx="2" />
                      <path d="M5 6h6M5 9h4" />
                    </svg>
                    Enviar plantilla
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {templateTarget && (
        <SingleTemplateModal
          convId={templateTarget.convId}
          phone={templateTarget.phone}
          name={templateTarget.name}
          onClose={() => setTemplateTarget(null)}
          onSent={refreshMsgs}
        />
      )}
      {showBroadcast && <BroadcastModal customers={customers} onClose={() => setShowBroadcast(false)} />}
      {showNewConv && (
        <NewConvModal
          customers={customers}
          customersLoading={customersLoading}
          onClose={() => setShowNewConv(false)}
          onCreated={async (convId) => { await refreshConvs(); setSelectedId(convId) }}
        />
      )}
    </div>
  )
}
