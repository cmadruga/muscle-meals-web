'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cart'
import { trackPurchase } from '@/lib/pixel'

export type OrderStatus = 'success' | 'pending' | 'failed'

interface Props {
  status: OrderStatus
  orderId?: string | null
  value?: number
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const F = {
  display: `'Franchise','Big Shoulders Display',sans-serif`,
  body:    `Barlow,system-ui,sans-serif`,
}

const STATUS = {
  success: {
    color:   '#F79138',
    bgAlpha: 'rgba(247,145,56,.13)',
    border:  'rgba(247,145,56,.3)',
    iconSize: { desk: 34, mob: 30 },
    icon: (
      <path d="M4 12.5l5.2 5.2L20 7" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    ),
    svgSize: { desk: 34, mob: 30 },
    heading: 'Pago confirmado',
    para: 'Ya estamos armando tu semana. Te mandamos los detalles por WhatsApp en unos minutos.',
    paraMbDesk: 30,
    paraMbMob:  26,
    note: null,
    ctaLabel: 'Ver mi pedido',
    secondary: 'Volver al inicio',
    secondaryHref: '/',
  },
  pending: {
    color:   '#E8B54A',
    bgAlpha: 'rgba(232,181,74,.13)',
    border:  'rgba(232,181,74,.3)',
    iconSize: { desk: 32, mob: 29 },
    icon: (
      <>
        <circle cx="12" cy="12" r="9" strokeWidth="2.2" />
        <path d="M12 7v5.4l3.4 2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    svgSize: { desk: 32, mob: 29 },
    heading: 'Pago pendiente',
    para: 'Tu pedido fue creado. Completa el pago con las instrucciones que MercadoPago te envió por correo.',
    paraMbDesk: 8,
    paraMbMob:  8,
    note: {
      text: 'Empezamos a cocinar en cuanto se acredite. Te avisamos por WhatsApp.',
      bg:   'rgba(232,181,74,.07)',
      brd:  'rgba(232,181,74,.24)',
      color:'rgba(245,241,236,.75)',
    },
    ctaLabel: 'Ver mi pedido',
    secondary: 'Volver al inicio',
    secondaryHref: '/',
  },
  failed: {
    color:   '#E4574C',
    bgAlpha: 'rgba(228,87,76,.13)',
    border:  'rgba(228,87,76,.32)',
    iconSize: { desk: 30, mob: 27 },
    icon: (
      <path d="M6 6l12 12M18 6L6 18" strokeWidth="2.6" strokeLinecap="round" />
    ),
    svgSize: { desk: 30, mob: 27 },
    heading: 'Pago rechazado',
    para: 'No se hizo ningún cargo a tu tarjeta. Tu pedido sigue guardado, puedes intentar de nuevo.',
    paraMbDesk: 8,
    paraMbMob:  8,
    note: {
      text: 'Suele ser fondos insuficientes, datos mal capturados o un rechazo del banco. Probar con otra tarjeta casi siempre funciona.',
      bg:   'rgba(255,255,255,.04)',
      brd:  'rgba(255,255,255,.09)',
      color:'rgba(245,241,236,.62)',
    },
    ctaLabel: 'Intentar de nuevo',
    secondary: 'Volver al inicio',
    secondaryHref: '/',
  },
} as const

// ── Component ─────────────────────────────────────────────────────────────────
export default function OrderStatusCard({ status, orderId, value = 0 }: Props) {
  const clearCart = useCartStore(s => s.clearCart)
  const cfg = STATUS[status]

  // Clear cart only on success
  useEffect(() => {
    if (status === 'success') {
      clearCart()
      if (orderId && value > 0) trackPurchase(value, orderId)
    }
  }, [status, clearCart, orderId, value])

  // Primary CTA href
  const primaryHref =
    status === 'failed'
      ? '/checkout'
      : orderId
        ? `/order/${orderId}`
        : null   // no orderId → hide primary CTA

  return (
    <>
      <style>{`
        /* ── Page ── */
        .os-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 56px 40px;
          background: #0f0d0c url('/media/fondo-auth.jpg') center/900px repeat;
          box-sizing: border-box;
        }

        /* ── Card ── */
        .os-card {
          width: 100%;
          max-width: 448px;
          background: #161311;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 14px;
          padding: 44px 40px 36px;
          text-align: center;
          box-shadow: 0 24px 60px rgba(0,0,0,.5);
        }

        /* ── Icon circle ── */
        .os-icon {
          width: 72px;
          height: 72px;
          margin: 0 auto 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ── CTA ── */
        .os-cta {
          display: block;
          width: 100%;
          box-sizing: border-box;
          padding: 16px 0;
          border: 0;
          border-radius: 9px;
          background: #F79138;
          color: #17140f;
          font: 700 20px/1 ${F.display};
          letter-spacing: .09em;
          text-transform: uppercase;
          text-decoration: none;
          text-align: center;
          box-shadow: 0 6px 20px rgba(247,145,56,.2);
          cursor: pointer;
        }
        .os-cta:hover { background: #ffa252; }

        /* ── Secondary link ── */
        .os-sec {
          display: block;
          margin-top: 14px;
          font: 500 13.5px/1 ${F.body};
          color: rgba(245,241,236,.55);
          text-decoration: none;
          text-align: center;
        }
        .os-sec:hover { color: #F5F1EC; }

        /* ── Mobile (≤600px) ── */
        @media (max-width: 600px) {
          .os-page {
            padding: 64px 22px 28px;
            background-size: 700px;
          }
          .os-card {
            padding: 36px 24px 28px;
          }
          .os-icon {
            width: 64px;
            height: 64px;
            margin-bottom: 22px;
          }
          .os-heading { font-size: 32px !important; margin-bottom: 12px !important; }
          .os-para    { font-size: 14.5px !important; }
          .os-note    { font-size: 12.5px !important; margin: 20px 0 24px !important; }
          .os-cta     { font-size: 19px !important; padding: 15px 0 !important; }
          .os-sec     { font-size: 13px !important; margin-top: 12px !important; padding: 10px 0; }
        }
      `}</style>

      <main className="os-page">
        <div className="os-card">

          {/* Icon */}
          <div
            className="os-icon"
            style={{
              background: cfg.bgAlpha,
              border: `1px solid ${cfg.border}`,
            }}
          >
            <svg
              width={cfg.svgSize.desk}
              height={cfg.svgSize.desk}
              viewBox="0 0 24 24"
              fill="none"
              stroke={cfg.color}
              aria-hidden="true"
            >
              {cfg.icon}
            </svg>
          </div>

          {/* Heading */}
          <h1
            className="os-heading"
            style={{
              margin: '0 0 14px',
              font: `700 40px/1 ${F.display}`,
              letterSpacing: '.01em',
              textTransform: 'uppercase',
              color: '#F5F1EC',
            }}
          >
            {cfg.heading}
          </h1>

          {/* Paragraph */}
          <p
            className="os-para"
            style={{
              margin: `0 0 ${cfg.paraMbDesk}px`,
              font: `400 15px/1.55 ${F.body}`,
              color: 'rgba(245,241,236,.72)',
              textWrap: 'pretty',
            } as React.CSSProperties}
          >
            {cfg.para}
          </p>

          {/* Note (pending / failed) */}
          {cfg.note && (
            <div
              className="os-note"
              style={{
                margin: '22px 0 28px',
                padding: '14px 16px',
                background: cfg.note.bg,
                border: `1px solid ${cfg.note.brd}`,
                borderRadius: 9,
                font: `400 13px/1.5 ${F.body}`,
                color: cfg.note.color,
                textAlign: 'left',
                textWrap: 'pretty',
              } as React.CSSProperties}
            >
              {cfg.note.text}
            </div>
          )}

          {/* Primary CTA */}
          {primaryHref && (
            <Link href={primaryHref} className="os-cta">
              {cfg.ctaLabel}
            </Link>
          )}

          {/* Secondary */}
          <Link href={cfg.secondaryHref} className="os-sec">
            {cfg.secondary}
          </Link>

        </div>
      </main>
    </>
  )
}
