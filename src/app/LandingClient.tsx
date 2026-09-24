'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import type { TouchEvent } from 'react'
import Link from 'next/link'
import { F } from '@/lib/ui-fonts'
import { isValidPostalCode } from '@/lib/address-validation'

/* ── Design tokens ─────────────────────────────────────────────────────────── */
const C = {
  page:    '#0a0908',
  steps:   '#0d0c0b',
  contact: '#090807',
  footer:  '#050505',
  card:    '#121110',
  orange:  '#F79138',
  text:    '#F5F1EC',
  ink:     '#17140f',
}

/* ── Photos ──────────────────────────────────────────────────────────────────*/
const PHOTOS = [
  '/media/meals-tray.jpg',
  '/media/photo-lifestyle.jpg',
  '/media/photo-desk.jpg',
]

/* ── Step data ───────────────────────────────────────────────────────────── */
const STEPS = [
  {
    title: 'Elige tu tamaño',
    desc:  'LOW, FIT o PLUS según la proteína que buscas — o arma el tuyo gramo por gramo.',
  },
  {
    title: 'Arma tu menú',
    desc:  'Mezcla los platillos de la semana. Al llegar a 5 entra solo el precio de paquete.',
  },
  {
    title: 'Hazte miembro',
    desc:  'El descuento se aplica solo, en cada pedido. Opcional: también puedes pedir sin membresía.',
  },
  {
    title: 'Paga y coordina',
    desc:  'Domicilio o pickup, tus datos y el pago en una sola pantalla.',
  },
  {
    title: 'Listo el domingo',
    desc:  'Llega cocinado y porcionado. Calienta y come.',
    isLast: true,
  },
]

/* ── Web Slide illustrations ─────────────────────────────────────────────── */
function Slide1Web() {
  return (
    <div style={{ width: 640, boxSizing: 'border-box', padding: '34px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
      <div style={{ font: `700 12px/1 ${F.cond}`, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(245,241,236,.45)' }}>1 · Tu tamaño</div>
      {/* LOW */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 18px', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, background: 'rgba(255,255,255,.03)' }}>
        <div style={{ width: 66, font: `700 27px/1 ${F.display}`, textTransform: 'uppercase', color: C.text }}>Low</div>
        <div style={{ flex: 1, height: 9, borderRadius: 5, background: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
          <div style={{ width: '38%', height: '100%', background: 'rgba(247,145,56,.55)' }} />
        </div>
        <div style={{ width: 80, textAlign: 'right', font: `500 14px/1 ${F.body}`, color: 'rgba(245,241,236,.6)' }}>160 g prot.</div>
      </div>
      {/* FIT */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14, padding: '15px 18px', border: `1px solid ${C.orange}`, borderRadius: 12, background: 'rgba(247,145,56,.1)' }}>
        <span style={{ position: 'absolute', top: -9, right: 14, padding: '3px 9px', borderRadius: 4, background: C.orange, font: `700 10px/1 ${F.body}`, letterSpacing: '.06em', textTransform: 'uppercase', color: C.ink }}>★ El más pedido</span>
        <div style={{ width: 66, font: `700 27px/1 ${F.display}`, textTransform: 'uppercase', color: C.orange }}>Fit</div>
        <div style={{ flex: 1, height: 9, borderRadius: 5, background: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
          <div style={{ width: '62%', height: '100%', background: C.orange }} />
        </div>
        <div style={{ width: 80, textAlign: 'right', font: `500 14px/1 ${F.body}`, color: C.text }}>180 g prot.</div>
      </div>
      {/* PLUS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 18px', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, background: 'rgba(255,255,255,.03)' }}>
        <div style={{ width: 66, font: `700 27px/1 ${F.display}`, textTransform: 'uppercase', color: C.text }}>Plus</div>
        <div style={{ flex: 1, height: 9, borderRadius: 5, background: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
          <div style={{ width: '86%', height: '100%', background: 'rgba(247,145,56,.55)' }} />
        </div>
        <div style={{ width: 80, textAlign: 'right', font: `500 14px/1 ${F.body}`, color: 'rgba(245,241,236,.6)' }}>220 g prot.</div>
      </div>
      {/* Custom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 18px', border: '1px dashed rgba(255,255,255,.25)', borderRadius: 12 }}>
        <div style={{ font: `700 19px/1 ${F.display}`, textTransform: 'uppercase', color: 'rgba(245,241,236,.8)' }}>+ A tu medida</div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          {['Proteina', 'Carbo', 'Verdura'].map(t => (
            <span key={t} style={{ padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,.07)', font: `500 12.5px/1 ${F.body}`, color: 'rgba(245,241,236,.65)' }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function Slide2Web() {
  return (
    <div style={{ width: 640, boxSizing: 'border-box', padding: '34px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
      <div style={{ font: `700 12px/1 ${F.cond}`, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(245,241,236,.45)' }}>2 · Tu menú de la semana</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[
          { src: '/media/meals-tray.jpg',      name: 'Pollo teriyaki', tag: '×2 agregado', active: true },
          { src: '/media/photo-desk.jpg',       name: 'Res con arroz',  tag: '×2 agregado', active: true },
          { src: '/media/photo-lifestyle.jpg',  name: 'Salmón y quinoa', tag: 'Agregar +',  active: false },
        ].map(m => (
          <div key={m.name} style={{ border: `1px solid ${m.active ? C.orange : 'rgba(255,255,255,.12)'}`, borderRadius: 12, overflow: 'hidden', background: m.active ? 'rgba(247,145,56,.08)' : 'rgba(255,255,255,.03)' }}>
            <div style={{ height: 74, background: `url(${m.src}) center/cover`, opacity: m.active ? 1 : .7 }} />
            <div style={{ padding: '10px 12px' }}>
              <div style={{ font: `600 13.5px/1.25 ${F.body}`, color: C.text }}>{m.name}</div>
              <div style={{ marginTop: 5, font: `700 11px/1 ${F.body}`, letterSpacing: '.06em', textTransform: 'uppercase', color: m.active ? C.orange : 'rgba(245,241,236,.5)' }}>{m.tag}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', border: '1px solid rgba(247,145,56,.45)', borderRadius: 12, background: 'rgba(247,145,56,.1)' }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {Array.from({ length: 5 }).map((_, i) => <span key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: C.orange, display: 'inline-block' }} />)}
        </div>
        <div style={{ font: `600 15px/1.3 ${F.body}`, color: C.text }}>5 platillos · precio de paquete aplicado</div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ font: `400 12.5px/1 ${F.body}`, color: 'rgba(245,241,236,.45)', textDecoration: 'line-through' }}>$750</div>
          <div style={{ marginTop: 3, font: `700 20px/1 ${F.display}`, color: C.orange }}>$650</div>
        </div>
      </div>
    </div>
  )
}

function Slide3Web() {
  return (
    <div style={{ width: 640, boxSizing: 'border-box', padding: '34px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
      <div style={{ font: `700 12px/1 ${F.cond}`, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(245,241,236,.45)' }}>3 · Membresía</div>
      <div style={{ display: 'flex', gap: 14 }}>
        <div style={{ flex: 1, padding: 20, border: '1px solid rgba(255,255,255,.12)', borderRadius: 14, background: 'rgba(255,255,255,.03)' }}>
          <div style={{ font: `700 20px/1 ${F.display}`, textTransform: 'uppercase', color: 'rgba(245,241,236,.8)' }}>Sin membresia</div>
          <div style={{ marginTop: 14, font: `400 14px/1.5 ${F.body}`, color: 'rgba(245,241,236,.55)' }}>Pides cuando quieras, al precio normal.</div>
          <div style={{ marginTop: 18, font: `700 26px/1 ${F.display}`, color: C.text }}>$650<span style={{ font: `500 13px/1 ${F.body}`, color: 'rgba(245,241,236,.45)' }}> / semana</span></div>
        </div>
        <div style={{ position: 'relative', flex: 1, padding: 20, border: `1px solid ${C.orange}`, borderRadius: 14, background: 'rgba(247,145,56,.1)' }}>
          <span style={{ position: 'absolute', top: -9, left: 20, padding: '3px 9px', borderRadius: 4, background: C.orange, font: `700 10px/1 ${F.body}`, letterSpacing: '.06em', textTransform: 'uppercase', color: C.ink }}>Activa</span>
          <div style={{ font: `700 20px/1 ${F.display}`, textTransform: 'uppercase', color: C.orange }}>Con membresia</div>
          <div style={{ marginTop: 14, font: `400 14px/1.5 ${F.body}`, color: 'rgba(245,241,236,.7)' }}>El descuento entra solo en cada pedido.</div>
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'baseline', gap: 9 }}>
            <div style={{ font: `700 26px/1 ${F.display}`, color: C.orange }}>$552</div>
            <div style={{ font: `400 14px/1 ${F.body}`, color: 'rgba(245,241,236,.45)', textDecoration: 'line-through' }}>$650</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '14px 18px', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, background: 'rgba(255,255,255,.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', font: `500 13.5px/1 ${F.body}`, color: 'rgba(245,241,236,.6)' }}>
          <span>Tu membresía</span><span style={{ color: C.text }}>6 de 8 semanas</span>
        </div>
        <div style={{ marginTop: 10, height: 8, borderRadius: 5, background: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
          <div style={{ width: '75%', height: '100%', background: C.orange }} />
        </div>
      </div>
    </div>
  )
}

function Slide4Web() {
  return (
    <div style={{ width: 640, boxSizing: 'border-box', padding: '34px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
      <div style={{ font: `700 12px/1 ${F.cond}`, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(245,241,236,.45)' }}>4 · Checkout</div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, padding: '16px 18px', border: `1px solid ${C.orange}`, borderRadius: 12, background: 'rgba(247,145,56,.1)' }}>
          <div style={{ font: `700 17px/1 ${F.display}`, textTransform: 'uppercase', color: C.orange }}>A domicilio</div>
          <div style={{ marginTop: 7, font: `400 13px/1.35 ${F.body}`, color: 'rgba(245,241,236,.6)' }}>Domingo, 9 am – 2 pm</div>
        </div>
        <div style={{ flex: 1, padding: '16px 18px', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, background: 'rgba(255,255,255,.03)' }}>
          <div style={{ font: `700 17px/1 ${F.display}`, textTransform: 'uppercase', color: 'rgba(245,241,236,.8)' }}>Pickup</div>
          <div style={{ marginTop: 7, font: `400 13px/1.35 ${F.body}`, color: 'rgba(245,241,236,.5)' }}>Elige el punto más cercano</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ padding: '13px 15px', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, font: `500 14px/1 ${F.body}`, color: C.text }}>Carlos Medina</div>
        <div style={{ padding: '13px 15px', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, font: `500 14px/1 ${F.body}`, color: C.text }}>662 000 0000</div>
        <div style={{ gridColumn: '1/-1', padding: '13px 15px', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, font: `500 14px/1 ${F.body}`, color: C.text }}>Blvd. Solidaridad 233, Hermosillo</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '15px 18px', borderRadius: 12, background: C.orange }}>
        <span style={{ font: `700 18px/1 ${F.display}`, letterSpacing: '.05em', textTransform: 'uppercase', color: C.ink }}>Pagar $552</span>
        <span style={{ marginLeft: 'auto', font: `600 13.5px/1 ${F.body}`, color: 'rgba(23,20,15,.72)' }}>Un solo paso · tarjeta o transferencia</span>
      </div>
    </div>
  )
}

function Slide5Web() {
  return (
    <div style={{ width: 640, boxSizing: 'border-box', padding: '34px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
      <div style={{ font: `700 12px/1 ${F.cond}`, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(245,241,236,.45)' }}>5 · Domingo</div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
        <div style={{ flex: 1.1, borderRadius: 14, overflow: 'hidden', background: 'url(/media/meals-tray.jpg) center/cover', minHeight: 186 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { name: 'Pollo teriyaki',  detail: '180 g prot. · listo para calentar' },
            { name: 'Res con arroz',   detail: '180 g prot. · listo para calentar' },
          ].map(m => (
            <div key={m.name} style={{ padding: '13px 15px', border: '1px solid rgba(255,255,255,.12)', borderRadius: 11, background: 'rgba(255,255,255,.03)' }}>
              <div style={{ font: `600 14px/1 ${F.body}`, color: C.text }}>{m.name}</div>
              <div style={{ marginTop: 5, font: `400 12.5px/1 ${F.body}`, color: 'rgba(245,241,236,.5)' }}>{m.detail}</div>
            </div>
          ))}
          <div style={{ padding: '13px 15px', border: '1px solid rgba(247,145,56,.45)', borderRadius: 11, background: 'rgba(247,145,56,.1)' }}>
            <div style={{ font: `600 14px/1 ${F.body}`, color: C.orange }}>+ 3 platillos más</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 12, background: 'rgba(247,145,56,.12)', border: '1px solid rgba(247,145,56,.4)' }}>
        <span style={{ font: `700 17px/1 ${F.display}`, letterSpacing: '.05em', textTransform: 'uppercase', color: C.orange }}>Entregado</span>
        <span style={{ font: `500 14.5px/1 ${F.body}`, color: C.text }}>Solo calienta y come — cero minutos de cocina.</span>
      </div>
    </div>
  )
}

const WEB_SLIDES = [<Slide1Web key={0} />, <Slide2Web key={1} />, <Slide3Web key={2} />, <Slide4Web key={3} />, <Slide5Web key={4} />]

/* ── Mobile Slide illustrations ──────────────────────────────────────────── */
function Slide1Mobile() {
  return (
    <>
      {[
        { label: 'Low', pct: '38%', dim: true, text: '160 g prot.' },
        { label: 'Fit', pct: '62%', dim: false, text: '180 g prot.' },
        { label: 'Plus', pct: '86%', dim: true, text: '220 g prot.' },
      ].map(s => (
        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', border: s.label === 'Fit' ? `1px solid ${C.orange}` : '1px solid rgba(255,255,255,.12)', borderRadius: 10, background: s.label === 'Fit' ? 'rgba(247,145,56,.1)' : 'rgba(255,255,255,.03)' }}>
          <div style={{ width: 44, font: `700 20px/1 ${F.display}`, textTransform: 'uppercase', color: s.label === 'Fit' ? C.orange : C.text }}>{s.label}</div>
          <div style={{ flex: 1, height: 7, borderRadius: 4, background: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
            <div style={{ width: s.pct, height: '100%', background: s.label === 'Fit' ? C.orange : 'rgba(247,145,56,.55)' }} />
          </div>
          <div style={{ width: 62, textAlign: 'right', font: `500 12px/1 ${F.body}`, color: 'rgba(245,241,236,.65)' }}>{s.text}</div>
        </div>
      ))}
      <div style={{ padding: '11px 13px', border: '1px dashed rgba(255,255,255,.25)', borderRadius: 10, font: `700 16px/1 ${F.display}`, textTransform: 'uppercase', color: 'rgba(245,241,236,.8)' }}>+ A tu medida</div>
    </>
  )
}

function Slide2Mobile() {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {[
          { src: '/media/meals-tray.jpg',     name: 'Teriyaki', tag: '×2',       active: true },
          { src: '/media/photo-desk.jpg',      name: 'Res',      tag: '×2',       active: true },
          { src: '/media/photo-lifestyle.jpg', name: 'Salmón',   tag: 'Agregar +', active: false },
        ].map(m => (
          <div key={m.name} style={{ border: `1px solid ${m.active ? C.orange : 'rgba(255,255,255,.12)'}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ height: 62, background: `url(${m.src}) center/cover` }} />
            <div style={{ padding: '7px 8px', font: `600 12px/1.2 ${F.body}`, color: C.text }}>
              {m.name}
              <div style={{ marginTop: 3, font: `700 10px/1 ${F.body}`, textTransform: 'uppercase', color: m.active ? C.orange : 'rgba(245,241,236,.45)' }}>{m.tag}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', border: '1px solid rgba(247,145,56,.45)', borderRadius: 10, background: 'rgba(247,145,56,.1)' }}>
        <div style={{ font: `600 13px/1.25 ${F.body}`, color: C.text }}>5 platillos · precio de paquete</div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ font: `400 11px/1 ${F.body}`, color: 'rgba(245,241,236,.45)', textDecoration: 'line-through' }}>$750</div>
          <div style={{ font: `700 18px/1 ${F.display}`, color: C.orange }}>$650</div>
        </div>
      </div>
    </>
  )
}

function Slide3Mobile() {
  return (
    <>
      <div style={{ display: 'flex', gap: 9 }}>
        {[
          { label: 'Sin membresia', price: '$650',  accent: false },
          { label: 'Con membresia', price: '$552',  accent: true, orig: '$650' },
        ].map(c => (
          <div key={c.label} style={{ flex: 1, padding: 12, border: c.accent ? `1px solid ${C.orange}` : '1px solid rgba(255,255,255,.12)', borderRadius: 10, background: c.accent ? 'rgba(247,145,56,.1)' : 'rgba(255,255,255,.03)' }}>
            <div style={{ font: `700 15px/1 ${F.display}`, textTransform: 'uppercase', color: c.accent ? C.orange : 'rgba(245,241,236,.8)' }}>{c.label}</div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ font: `700 22px/1 ${F.display}`, color: c.accent ? C.orange : C.text }}>{c.price}</span>
              {c.orig && <span style={{ font: `400 12px/1 ${F.body}`, color: 'rgba(245,241,236,.45)', textDecoration: 'line-through' }}>{c.orig}</span>}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '11px 13px', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', font: `500 12.5px/1 ${F.body}`, color: 'rgba(245,241,236,.6)' }}>
          <span>Tu membresía</span><span style={{ color: C.text }}>6 de 8 semanas</span>
        </div>
        <div style={{ marginTop: 8, height: 7, borderRadius: 4, background: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
          <div style={{ width: '75%', height: '100%', background: C.orange }} />
        </div>
      </div>
    </>
  )
}

function Slide4Mobile() {
  return (
    <>
      <div style={{ display: 'flex', gap: 9 }}>
        {[
          { label: 'A domicilio', detail: 'Dom 9 am – 2 pm', accent: true },
          { label: 'Pickup',       detail: 'Punto cercano',   accent: false },
        ].map(o => (
          <div key={o.label} style={{ flex: 1, padding: 12, border: o.accent ? `1px solid ${C.orange}` : '1px solid rgba(255,255,255,.12)', borderRadius: 10, background: o.accent ? 'rgba(247,145,56,.1)' : 'rgba(255,255,255,.03)' }}>
            <div style={{ font: `700 15px/1 ${F.display}`, textTransform: 'uppercase', color: o.accent ? C.orange : 'rgba(245,241,236,.8)' }}>{o.label}</div>
            <div style={{ marginTop: 5, font: `400 11.5px/1.3 ${F.body}`, color: o.accent ? 'rgba(245,241,236,.6)' : 'rgba(245,241,236,.5)' }}>{o.detail}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '11px 13px', border: '1px solid rgba(255,255,255,.12)', borderRadius: 9, font: `500 13px/1 ${F.body}`, color: C.text }}>Carlos Medina · 662 000 0000</div>
      <div style={{ display: 'flex', alignItems: 'center', padding: '13px 15px', borderRadius: 10, background: C.orange }}>
        <span style={{ font: `700 16px/1 ${F.display}`, letterSpacing: '.05em', textTransform: 'uppercase', color: C.ink }}>Pagar $552</span>
        <span style={{ marginLeft: 'auto', font: `600 11.5px/1 ${F.body}`, color: 'rgba(23,20,15,.72)' }}>Un solo paso</span>
      </div>
    </>
  )
}

function Slide5Mobile() {
  return (
    <>
      <div style={{ flex: 1, minHeight: 130, borderRadius: 11, background: 'url(/media/meals-tray.jpg) center/cover' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'rgba(247,145,56,.12)', border: '1px solid rgba(247,145,56,.4)' }}>
        <span style={{ font: `700 15px/1 ${F.display}`, letterSpacing: '.05em', textTransform: 'uppercase', color: C.orange }}>Entregado</span>
        <span style={{ font: `500 12.5px/1.3 ${F.body}`, color: C.text }}>Solo calienta y come</span>
      </div>
    </>
  )
}

const MOBILE_SLIDES = [<Slide1Mobile key={0} />, <Slide2Mobile key={1} />, <Slide3Mobile key={2} />, <Slide4Mobile key={3} />, <Slide5Mobile key={4} />]

/* ── Icon components ─────────────────────────────────────────────────────── */
function IgIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={C.orange} strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.6" cy="6.4" r="1.2" fill={C.orange} stroke="none" />
    </svg>
  )
}
function FbIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill={C.orange}>
      <path d="M14.2 22v-8.2h2.8l.42-3.2H14.2V8.5c0-.93.26-1.56 1.6-1.56h1.71V4.08A23 23 0 0 0 15.01 4c-2.47 0-4.16 1.5-4.16 4.27v2.33H8v3.2h2.85V22z" />
    </svg>
  )
}
function WaIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill={C.orange}>
      <path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.94.55 3.75 1.5 5.29L2 22l5-1.63a9.8 9.8 0 0 0 5.04 1.38c5.43 0 9.84-4.4 9.84-9.84S17.47 2 12.04 2m0 17.9a8.1 8.1 0 0 1-4.4-1.29l-.31-.19-2.97.96.97-2.89-.2-.3a8 8 0 0 1-1.25-4.35c0-4.46 3.7-8.09 8.16-8.09 4.47 0 8.16 3.63 8.16 8.09s-3.69 8.06-8.16 8.06m4.48-6.04c-.24-.12-1.45-.72-1.68-.8-.22-.09-.39-.13-.55.12s-.63.8-.77.97-.28.18-.52.06a6.7 6.7 0 0 1-1.97-1.21 7.4 7.4 0 0 1-1.36-1.69c-.14-.24 0-.37.11-.49.11-.11.24-.28.36-.43.12-.14.16-.24.24-.4.08-.17.04-.31-.02-.43s-.55-1.32-.75-1.81c-.2-.47-.4-.41-.55-.42h-.47a.9.9 0 0 0-.65.31c-.22.24-.85.83-.85 2.02s.87 2.34.99 2.5c.12.17 1.71 2.61 4.15 3.66.58.25 1.03.4 1.38.51.58.19 1.11.16 1.53.1.47-.07 1.45-.59 1.65-1.17.2-.57.2-1.06.14-1.16s-.22-.17-.46-.29" />
    </svg>
  )
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function LandingClient() {

  // Slideshow
  const [heroIdx, setHeroIdx] = useState(0)

  // Steps carousel
  const [step, setStep]     = useState(0)
  const [paused, setPaused] = useState(false)

  // CP validator
  const [cpInput,    setCpInput]    = useState('')
  const [cpStatus,   setCpStatus]   = useState<'idle'|'ok'|'no'|'bad'>('idle')
  const [cpVerified, setCpVerified] = useState('')
  const [cpLoading,  setCpLoading]  = useState(false)

  // Touch
  const touchStartX = useRef<number | null>(null)

  // Scroll targets
  const stepsRef   = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)

  // Slideshow timer
  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % 3), 5500)
    return () => clearInterval(t)
  }, [])

  // Steps auto-advance
  useEffect(() => {
    const t = setInterval(() => {
      if (!paused) setStep(i => (i + 1) % 5)
    }, 5000)
    return () => clearInterval(t)
  }, [paused])

  const goStep = useCallback((n: number) => setStep(n), [])
  const prev   = useCallback(() => setStep(i => (i + 4) % 5), [])
  const next   = useCallback(() => setStep(i => (i + 1) % 5), [])

  const handleVerify = useCallback(() => {
    const cp = cpInput.trim()
    if (cp.length < 5) { setCpStatus('bad'); return }
    setCpLoading(true)
    setTimeout(() => {
      const valid = isValidPostalCode(cp)
      setCpVerified(cp)
      setCpStatus(valid ? 'ok' : 'no')
      setCpLoading(false)
      if (valid) {
        try { localStorage.setItem('mm_cp', cp) } catch {}
      }
    }, 300)
  }, [cpInput])

  // Cintillo height is the scroll offset to avoid hiding section headings
  const CINCH_H_PX = 51

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return
    const top = ref.current.getBoundingClientRect().top + window.scrollY - CINCH_H_PX
    window.scrollTo({ top, behavior: 'smooth' })
  }

  // Touch handlers for mobile carousel
  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd   = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40) { dx < 0 ? next() : prev() }
    touchStartX.current = null
  }

  // Color helpers
  const stepC = (i: number) => i === step ? C.orange : 'rgba(247,145,56,.3)'
  const stepT = (i: number) => i === step ? C.text : 'rgba(245,241,236,.55)'
  const stepB = (i: number) => i === step ? C.orange : 'rgba(255,255,255,.14)'

  return (
    <div style={{ background: C.page, color: C.text, fontFamily: F.body }}>
      <style>{`
        /* Responsive */
        .lp-hero-overlay-h { display: block; }
        .lp-hero-overlay-v { display: none; }
        .lp-hero-content   { padding: 0 56px; justify-content: center; }
        .lp-hero-logo      { width: 620px; }
        .lp-hero-bar       { width: 78px; height: 5px; background: ${C.orange}; }
        .lp-hero-h1        { font: 700 40px/1.06 ${F.display}; }
        .lp-hero-btns      { width: 500px; max-width: 100%; }
        .lp-hero-btn-p     { padding: 20px; font: 700 20px/1 ${F.display}; }
        .lp-hero-btn-s     { padding: 17px 12px; font: 700 20px/1 ${F.display}; }
        .lp-dots-web       { display: flex; }
        .lp-dots-mob       { display: none; }
        .lp-desliza        { display: flex; }
        .lp-avatar-name    { display: inline; }
        .lp-cintillo-inner { gap: 34px; padding: 16px 56px; }
        .lp-cintillo-text  { font: 700 19px/1 ${F.display}; }
        .lp-cintillo-dot   { width: 5px; height: 5px; }
        .lp-steps-section  { padding: 58px 56px 56px; }
        .lp-steps-head     { display: flex; }
        .lp-steps-grid     { display: grid; grid-template-columns: 1fr 640px; gap: 40px; align-items: start; }
        .lp-steps-list     { display: flex; }
        .lp-steps-mobile   { display: none; }
        .lp-contact        { display: grid; grid-template-columns: 1.05fr .95fr; }
        .lp-contact-left   { padding: 58px 46px 56px 56px; }
        .lp-contact-right  { padding: 58px 56px 56px 46px; }
        .lp-contact-btns   { display: flex; flex-wrap: wrap; }
        .lp-footer         { padding: 22px 56px; flex-direction: row; }
        .lp-footer-copy    { display: inline; }
        .lp-cp-section     { padding: 52px 56px; display: grid; grid-template-columns: minmax(0,1fr) 520px; gap: 48px; align-items: center; }
        .lp-cp-text-short  { display: none; }
        .lp-cp-text-full   { display: inline; }

        @media (max-width: 960px) {
          .lp-hero-overlay-h { display: none; }
          .lp-hero-overlay-v { display: block; }
          .lp-hero-content   { padding: 0 22px 64px; justify-content: flex-end; }
          .lp-hero-logo      { width: 100%; }
          .lp-hero-bar       { width: 60px; height: 4px; background: ${C.orange}; }
          .lp-hero-h1        { font: 700 30px/1.05 ${F.display}; }
          .lp-hero-btns      { width: 100%; }
          .lp-hero-btn-p     { padding: 17px; font: 700 18px/1 ${F.display}; }
          .lp-hero-btn-s     { padding: 15px 8px; font: 700 16px/1 ${F.display}; }
          .lp-dots-web       { display: none; }
          .lp-dots-mob       { display: flex; }
          .lp-desliza        { display: none; }
          .lp-cintillo-inner { gap: 8px; padding: 12px 12px; }
          .lp-cintillo-text  { font: 700 12.5px/1 ${F.display}; }
          .lp-cintillo-dot   { width: 3px; height: 3px; }
          .lp-steps-section  { padding: 36px 22px 34px; }
          .lp-steps-head     { display: none; }
          .lp-steps-grid     { display: none; }
          .lp-steps-list     { display: none; }
          .lp-steps-mobile   { display: block; }
          .lp-contact        { display: block; }
          .lp-contact-left   { padding: 36px 22px 30px; }
          .lp-contact-right  { padding: 28px 22px 30px; }
          .lp-contact-btns   { flex-direction: column; }
          .lp-footer         { padding: 18px 22px; flex-direction: column; align-items: center; gap: 10px; }
          .lp-footer-copy    { display: block; font-size: 11.5px !important; }
          .lp-cp-section     { padding: 34px 22px; display: block; }
          .lp-cp-right       { margin-top: 14px; }
          .lp-cp-text-short  { display: inline; }
          .lp-cp-text-full   { display: none; }
        }

        /* Hover states */
        .lp-btn-secondary:hover { background: rgba(245,241,236,.12) !important; }
        .lp-btn-contact:hover   { border-color: ${C.orange} !important; background: rgba(247,145,56,.1) !important; }
        .lp-nav-arrow:hover     { border-color: ${C.orange} !important; color: ${C.orange} !important; }
        .lp-step-row:hover .lp-step-num { color: ${C.orange}; }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .lp-photo { transition: opacity 1.4s ease !important; transform: scale(1) !important; }
          .lp-steps-track { transition: none !important; }
          .lp-mob-track   { transition: none !important; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════════════
          BANNER
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', height: 'calc(100svh - 51px)', overflow: 'hidden', background: '#050505' }}
               className="lp-banner">
        {/* Photos */}
        {PHOTOS.map((src, i) => (
          <div key={i} className="lp-photo" style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: i === heroIdx ? 1 : 0,
            transform: `scale(${i === heroIdx ? 1.08 : 1})`,
            transition: 'opacity 1.4s ease, transform 7s linear',
          }} />
        ))}

        {/* Overlay — horizontal (web) */}
        <div className="lp-hero-overlay-h" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(95deg,rgba(5,5,5,.95) 0%,rgba(5,5,5,.84) 46%,rgba(5,5,5,.3) 100%)' }} />
        {/* Overlay — vertical (mobile) */}
        <div className="lp-hero-overlay-v" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(5,5,5,.6) 0%,rgba(5,5,5,.78) 45%,rgba(5,5,5,.95) 100%)' }} />

        {/* Content */}
        <div className="lp-hero-content" style={{ position: 'relative', zIndex: 1, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 26, maxWidth: 780 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/logo-color.png" alt="Muscle Meals" className="lp-hero-logo" style={{ maxWidth: '100%', display: 'block' }} />
          <div className="lp-hero-bar" />
          <h1 className="lp-hero-h1" style={{ margin: 0, maxWidth: 600, textTransform: 'uppercase', color: C.text, textWrap: 'balance' } as React.CSSProperties}>
            Comida preparada con <span style={{ color: C.orange }}>los macros exactos</span> para alcanzar tus metas
          </h1>
          <div className="lp-hero-btns" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 6 }}>
            <Link href="/menu" className="lp-hero-btn-p" style={{ display: 'block', borderRadius: 10, background: C.orange, letterSpacing: '.07em', textTransform: 'uppercase', color: C.ink, textAlign: 'center', textDecoration: 'none' }}>
              Ordenar
            </Link>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button onClick={() => scrollTo(stepsRef)} className="lp-hero-btn-s lp-btn-secondary" style={{ border: '2px solid rgba(245,241,236,.85)', borderRadius: 10, background: 'rgba(5,5,5,.25)', letterSpacing: '.07em', textTransform: 'uppercase', color: C.text, textAlign: 'center', cursor: 'pointer' }}>
                Cómo funciona
              </button>
              <button onClick={() => scrollTo(contactRef)} className="lp-hero-btn-s lp-btn-secondary" style={{ border: '2px solid rgba(245,241,236,.85)', borderRadius: 10, background: 'rgba(5,5,5,.25)', letterSpacing: '.07em', textTransform: 'uppercase', color: C.text, textAlign: 'center', cursor: 'pointer' }}>
                Contacto
              </button>
            </div>
          </div>
        </div>

        {/* Dot indicators — web: bottom left */}
        <div className="lp-dots-web" style={{ position: 'absolute', left: 56, bottom: 34, zIndex: 1, gap: 7 }}>
          {PHOTOS.map((_, i) => (
            <span key={i} style={{ width: i === heroIdx ? 26 : 8, height: 4, borderRadius: 4, background: i === heroIdx ? C.orange : 'rgba(245,241,236,.35)', transition: 'all .4s', display: 'block' }} />
          ))}
        </div>

        {/* Dot indicators — mobile: bottom center */}
        <div className="lp-dots-mob" style={{ position: 'absolute', left: '50%', bottom: 28, zIndex: 1, transform: 'translateX(-50%)', gap: 7 }}>
          {PHOTOS.map((_, i) => (
            <span key={i} style={{ width: i === heroIdx ? 26 : 8, height: 3, borderRadius: 3, background: i === heroIdx ? C.orange : 'rgba(245,241,236,.35)', transition: 'all .4s', display: 'block' }} />
          ))}
        </div>

        {/* Desliza ↓ — web only */}
        <button onClick={() => scrollTo(stepsRef)} className="lp-desliza" style={{ position: 'absolute', left: '50%', bottom: 26, zIndex: 1, transform: 'translateX(-50%)', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', background: 'none', border: 'none' }}>
          <span style={{ font: `600 11px/1 ${F.body}`, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(245,241,236,.55)' }}>Desliza</span>
          <span style={{ font: `400 18px/1 ${F.body}`, color: C.orange }}>↓</span>
        </button>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          CINTILLO
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.orange, boxShadow: '0 6px 18px rgba(0,0,0,.35)', overflow: 'hidden' }}>
        <div className="lp-cintillo-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'nowrap', overflow: 'hidden' }}>
          {['Macros exactos', 'Cocinado y porcionado', 'Entregas semanales'].map((text, i) => (
            <React.Fragment key={text}>
              {i > 0 && <span className="lp-cintillo-dot" style={{ flexShrink: 0, borderRadius: '50%', background: 'rgba(23,20,15,.5)' }} />}
              <span className="lp-cintillo-text" style={{ letterSpacing: '.05em', textTransform: 'uppercase', color: C.ink, whiteSpace: 'nowrap' }}>{text}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ASÍ FUNCIONA
      ══════════════════════════════════════════════════════════════════════ */}
      <div ref={stepsRef} className="lp-steps-section" style={{ background: '#0d0c0b', scrollMarginTop: CINCH_H_PX }}>

        {/* Header — web only */}
        <div className="lp-steps-head" style={{ alignItems: 'flex-end', justifyContent: 'space-between', gap: 30, marginBottom: 34 }}>
          <div>
            <div style={{ font: `600 12px/1 ${F.body}`, letterSpacing: '.2em', textTransform: 'uppercase', color: C.orange }}>Así funciona</div>
            <h2 style={{ margin: '12px 0 0', font: `700 54px/.93 ${F.display}`, textTransform: 'uppercase', color: C.text }}>Tu semana resuelta<br />en cinco pasos</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={prev} className="lp-nav-arrow" style={{ width: 44, height: 44, border: '1px solid rgba(255,255,255,.18)', borderRadius: '50%', background: 'transparent', color: C.text, font: `400 18px/1 ${F.body}`, cursor: 'pointer' }}>←</button>
            <button onClick={next} className="lp-nav-arrow" style={{ width: 44, height: 44, border: '1px solid rgba(255,255,255,.18)', borderRadius: '50%', background: 'transparent', color: C.text, font: `400 18px/1 ${F.body}`, cursor: 'pointer' }}>→</button>
          </div>
        </div>

        {/* Web grid */}
        <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} className="lp-steps-grid">

          {/* Step list */}
          <div className="lp-steps-list" style={{ flexDirection: 'column' }}>
            {STEPS.map((s, i) => (
              <div key={i} onClick={() => goStep(i)} className="lp-step-row" style={{ display: 'flex', gap: 18, padding: '18px 0', borderTop: '1px solid rgba(255,255,255,.1)', ...(i === 4 ? { borderBottom: '1px solid rgba(255,255,255,.1)' } : {}), cursor: 'pointer' }}>
                <div className="lp-step-num" style={{ flexShrink: 0, width: 38, font: `700 30px/1 ${F.display}`, color: stepC(i) }}>{String(i + 1).padStart(2, '0')}</div>
                <div>
                  <h3 style={{ margin: '0 0 6px', font: `700 25px/1 ${F.display}`, textTransform: 'uppercase', color: stepT(i) }}>{s.title}</h3>
                  <p style={{ margin: 0, font: `400 15px/1.5 ${F.body}`, color: 'rgba(245,241,236,.6)' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Illustration panel */}
          <div>
            <div style={{ position: 'relative', width: 640, height: 430, overflow: 'hidden', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, background: '#121110 url(/media/Fondo.jpg) center/700px repeat' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,7,.86)' }} />
              <div className="lp-steps-track" style={{ position: 'absolute', top: 0, left: 0, display: 'flex', width: `${640 * 5}px`, height: '100%', transition: 'transform .5s cubic-bezier(.4,0,.2,1)', transform: `translateX(${-640 * step}px)` }}>
                {WEB_SLIDES}
              </div>
            </div>
            {/* Progress */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {[0,1,2,3,4].map(i => (
                <div key={i} onClick={() => goStep(i)} style={{ flex: 1, height: 4, borderRadius: 2, cursor: 'pointer', background: stepB(i) }} />
              ))}
            </div>
            <Link href="/menu" style={{ display: 'block', marginTop: 18, padding: 17, textAlign: 'center', borderRadius: 10, background: C.orange, font: `700 18px/1 ${F.display}`, letterSpacing: '.06em', textTransform: 'uppercase', color: C.ink, textDecoration: 'none' }}>
              Empezar mi pedido
            </Link>
          </div>
        </div>

        {/* Mobile */}
        <div className="lp-steps-mobile">
          {/* Mobile header */}
          <div>
            <div style={{ font: `600 11px/1 ${F.body}`, letterSpacing: '.2em', textTransform: 'uppercase', color: C.orange }}>Así funciona</div>
            <h2 style={{ margin: '10px 0 22px', font: `700 36px/.93 ${F.display}`, textTransform: 'uppercase', color: C.text }}>Tu semana resuelta<br />en cinco pasos</h2>
          </div>
          {/* Carousel */}
          <div style={{ overflow: 'hidden' }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div className="lp-mob-track" style={{ display: 'flex', transition: 'transform .5s cubic-bezier(.4,0,.2,1)', transform: `translateX(${-100 * step}%)` }}>
              {STEPS.map((s, i) => (
                <div key={i} style={{ width: '100%', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Illustration */}
                  <div style={{ position: 'relative', height: 246, overflow: 'hidden', border: '1px solid rgba(255,255,255,.1)', borderRadius: 14, background: '#121110 url(/media/Fondo.jpg) center/500px repeat' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,7,.86)' }} />
                    <div style={{ position: 'relative', height: '100%', boxSizing: 'border-box', padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 9 }}>
                      {MOBILE_SLIDES[i]}
                    </div>
                  </div>
                  {/* Text */}
                  <div style={{ display: 'flex', gap: 14 }}>
                    <div style={{ flexShrink: 0, font: `700 30px/1 ${F.display}`, color: C.orange }}>{String(i + 1).padStart(2, '0')}</div>
                    <div>
                      <h3 style={{ margin: '0 0 6px', font: `700 22px/1 ${F.display}`, textTransform: 'uppercase', color: s.isLast ? C.orange : C.text }}>{s.title}</h3>
                      <p style={{ margin: 0, font: `400 14.5px/1.5 ${F.body}`, color: 'rgba(245,241,236,.62)' }}>{s.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
            <div style={{ flex: 1, display: 'flex', gap: 6 }}>
              {[0,1,2,3,4].map(i => (
                <div key={i} onClick={() => goStep(i)} style={{ flex: 1, height: 4, borderRadius: 2, cursor: 'pointer', background: stepB(i) }} />
              ))}
            </div>
            <button onClick={prev} style={{ width: 44, height: 44, border: '1px solid rgba(255,255,255,.18)', borderRadius: '50%', background: 'transparent', color: C.text, font: `400 18px/1 ${F.body}`, cursor: 'pointer' }}>←</button>
            <button onClick={next} style={{ width: 44, height: 44, border: '1px solid rgba(255,255,255,.18)', borderRadius: '50%', background: 'transparent', color: C.text, font: `400 18px/1 ${F.body}`, cursor: 'pointer' }}>→</button>
          </div>
          <Link href="/menu" style={{ display: 'block', marginTop: 24, padding: 16, borderRadius: 10, background: C.orange, textAlign: 'center', font: `700 17px/1 ${F.display}`, letterSpacing: '.06em', textTransform: 'uppercase', color: C.ink, textDecoration: 'none' }}>
            Empezar mi pedido
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          CÓDIGO POSTAL
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="lp-cp-section"
        style={{
          borderTop: '1px solid rgba(255,255,255,.08)',
          background: `#0a0908 url(/media/Fondo.jpg) center/900px repeat`,
          position: 'relative',
        }}
      >
        {/* overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,7,.88)', pointerEvents: 'none' }} />

        {/* Left — text */}
        <div style={{ position: 'relative' }}>
          <div style={{ font: `600 12px/1 ${F.body}`, letterSpacing: '.2em', textTransform: 'uppercase', color: C.orange, marginBottom: 14 }}>
            Cobertura
          </div>
          <h2 style={{ margin: '0 0 14px', font: `700 46px/1.05 ${F.display}`, textTransform: 'uppercase', color: C.text }}>
            ¿Llegamos a tu zona?
          </h2>
          <p style={{ margin: 0, font: `400 16px/1.55 ${F.body}`, color: 'rgba(245,241,236,.6)', maxWidth: '42ch' }}>
            <span className="lp-cp-text-full">Escribe tu codigo postal y te decimos al momento si hay entrega a domicilio.</span>
            <span className="lp-cp-text-short">Escríbelo y te decimos al momento.</span>
          </p>
        </div>

        {/* Right — input + result */}
        <div className="lp-cp-right" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <label style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>Código postal</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={5}
                value={cpInput}
                placeholder="Ej. 64000"
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 5)
                  setCpInput(v)
                  if (cpStatus === 'bad') setCpStatus('idle')
                }}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                style={{
                  height: 56,
                  padding: '0 18px',
                  borderRadius: 10,
                  border: '1.5px solid rgba(255,255,255,.18)',
                  background: 'rgba(0,0,0,.35)',
                  color: C.text,
                  font: `600 16px/1 ${F.body}`,
                  letterSpacing: '.12em',
                  outline: 'none',
                  WebkitAppearance: 'none',
                  fontSize: 16,
                }}
                onFocus={e => (e.currentTarget.style.borderColor = C.orange)}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.18)')}
              />
            </label>
            <button
              onClick={handleVerify}
              disabled={cpLoading}
              style={{
                flexShrink: 0,
                height: 56,
                padding: '0 26px',
                borderRadius: 10,
                border: 'none',
                background: C.orange,
                color: C.ink,
                font: `700 18px/1 ${F.display}`,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                cursor: cpLoading ? 'wait' : 'pointer',
                opacity: cpLoading ? .7 : 1,
              }}
            >
              {cpLoading ? '…' : 'Verificar'}
            </button>
          </div>

          {/* Status */}
          <div aria-live="polite" style={{ marginTop: 12 }}>
            {cpStatus === 'idle' && (
              <p style={{ margin: 0, font: `400 13.5px/1.5 ${F.body}`, color: 'rgba(245,241,236,.45)' }}>
                Entregamos a domicilio los domingos. Si no llegamos a tu zona, puedes recoger en un punto de pickup.
              </p>
            )}
            {cpStatus === 'bad' && (
              <p style={{ margin: 0, font: `400 13.5px/1 ${F.body}`, color: '#e08078' }}>
                Escribe un codigo postal de 5 dígitos.
              </p>
            )}
            {cpStatus === 'ok' && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px', borderRadius: 10, border: '1px solid rgba(47,168,116,.45)', background: 'rgba(47,168,116,.12)' }}>
                <div style={{ flexShrink: 0, width: 26, height: 26, borderRadius: '50%', background: '#2fa874', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L19 7"/></svg>
                </div>
                <div>
                  <p style={{ margin: '0 0 6px', font: `500 14px/1.4 ${F.body}`, color: C.text }}>
                    ¡Si llegamos al <strong>{cpVerified}</strong>! Entrega a domicilio el domingo.
                  </p>
                  <Link href="/menu" style={{ font: `700 13px/1 ${F.display}`, letterSpacing: '.08em', textTransform: 'uppercase', color: '#4fce93', textDecoration: 'none' }}>
                    Ordenar →
                  </Link>
                </div>
              </div>
            )}
            {cpStatus === 'no' && (
              <div style={{ padding: '14px 18px', borderRadius: 10, border: '1px solid rgba(247,145,56,.45)', background: 'rgba(247,145,56,.1)' }}>
                <p style={{ margin: '0 0 6px', font: `500 14px/1.4 ${F.body}`, color: C.text }}>
                  Aun no entregamos en el <strong>{cpVerified}</strong>, pero puedes recoger en un punto de pickup.
                </p>
                <button
                  onClick={() => scrollTo(contactRef)}
                  style={{ background: 'none', border: 'none', padding: 0, font: `700 13px/1 ${F.display}`, letterSpacing: '.08em', textTransform: 'uppercase', color: C.orange, cursor: 'pointer' }}
                >
                  Escríbenos →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          CONTACTO
      ══════════════════════════════════════════════════════════════════════ */}
      <div ref={contactRef} className="lp-contact" style={{ background: '#090807', borderTop: '1px solid rgba(255,255,255,.08)', scrollMarginTop: CINCH_H_PX }}>

        {/* Left */}
        <div className="lp-contact-left">
          <div style={{ font: `600 12px/1 ${F.body}`, letterSpacing: '.2em', textTransform: 'uppercase', color: C.orange }}>Contacto</div>
          <h2 style={{ margin: '12px 0 14px', font: `700 48px/.95 ${F.display}`, textTransform: 'uppercase', color: C.text }}>¿Dudas antes<br />de ordenar?</h2>
          <p style={{ margin: '0 0 30px', maxWidth: 420, font: `400 16px/1.55 ${F.body}`, color: 'rgba(245,241,236,.6)' }}>
            Escribenos y te contestamos el mismo dia: dudas de macros, cambios en tu pedido o la zona de entrega.
          </p>
          <div className="lp-contact-btns" style={{ gap: 12 }}>
            {[
              { href: 'https://www.instagram.com/musclemeals.mx',              icon: <IgIcon />, label: 'Instagram' },
              { href: 'https://www.facebook.com/profile.php?id=61552292761945', icon: <FbIcon />, label: 'Facebook' },
              { href: 'https://wa.me/8136069805',                               icon: <WaIcon />, label: 'WhatsApp' },
            ].map(({ href, icon, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="lp-btn-contact" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px 22px', border: '1px solid rgba(255,255,255,.14)', borderRadius: 12, background: 'rgba(255,255,255,.04)', font: `600 15px/1 ${F.body}`, letterSpacing: '.02em', color: C.text, textDecoration: 'none' }}>
                {icon} {label}
              </a>
            ))}
          </div>
        </div>

        {/* Right — delivery info */}
        <div className="lp-contact-right" style={{ position: 'relative', background: '#0d0c0b url(/media/Fondo.jpg) center/900px repeat' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,6,6,.85)' }} />
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 22 }}>
            {[
              { label: 'Entregas',           body: <>Domingos, 9:00 am – 2:00 pm<br /><span style={{ color: 'rgba(245,241,236,.55)' }}>A domicilio en Hermosillo o en punto de pickup</span></> },
              { label: 'Cierre de pedidos',  body: <>Jueves 8:00 pm<br /><span style={{ color: 'rgba(245,241,236,.55)' }}>Lo que entre despues va a la semana siguiente</span></> },
              { label: 'Atención',           body: 'Lunes a sabado, 9:00 am – 7:00 pm' },
            ].map(row => (
              <div key={row.label}>
                <div style={{ font: `700 13px/1 ${F.cond}`, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(245,241,236,.45)' }}>{row.label}</div>
                <div style={{ marginTop: 8, font: `500 16px/1.5 ${F.body}`, color: C.text }}>{row.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="lp-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#050505', borderTop: '1px solid rgba(255,255,255,.07)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/logo-horizontal.png" alt="Muscle Meals" style={{ height: 20, display: 'block', opacity: .85 }} />
        <span className="lp-footer-copy" style={{ font: `400 12.5px/1 ${F.body}`, color: 'rgba(245,241,236,.38)' }}>© 2026 Muscle Meals. Todos los derechos reservados.</span>
      </div>
    </div>
  )
}
