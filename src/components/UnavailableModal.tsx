'use client'

const F = {
  display: `'Franchise','Big Shoulders Display',sans-serif`,
  body:    `Barlow,system-ui,sans-serif`,
}

export type UnavailableItem = {
  name: string
  sizeName: string
  qty: number
}

interface Props {
  items: UnavailableItem[]
  onClose: () => void
}

export default function UnavailableModal({ items, onClose }: Props) {
  const count = items.length
  const heading = `${count} platillo${count !== 1 ? 's' : ''} ya no esta disponible`

  return (
    <>
      <style>{`
        .unacc-overlay {
          position: fixed; inset: 0; z-index: 9998;
          background: rgba(0,0,0,.72);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
        }
        .unacc-card {
          width: 100%; max-width: 580px;
          background: #191614;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 14px;
          padding: 36px 36px 28px;
          box-shadow: 0 24px 60px rgba(0,0,0,.55);
        }
        .unacc-list-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 12px;
          background: rgba(255,255,255,.04);
          border-radius: 7px;
        }
        .unacc-cta:hover { background: #ffa252 !important; }
        @media (max-width: 600px) {
          .unacc-overlay { padding: 16px; align-items: flex-end; }
          .unacc-card { padding: 28px 20px 24px; border-radius: 18px 18px 0 0; }
        }
      `}</style>

      <div className="unacc-overlay" onClick={onClose}>
        <div className="unacc-card" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">

          {/* Icon */}
          <div style={{
            width: 48, height: 48,
            borderRadius: '50%',
            background: 'rgba(232,181,74,.13)',
            border: '1px solid rgba(232,181,74,.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8B54A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
          </div>

          {/* Heading */}
          <h2 style={{
            margin: '0 0 10px',
            font: `700 26px/1.05 ${F.display}`,
            textTransform: 'uppercase',
            letterSpacing: '.01em',
            color: '#F5F1EC',
          }}>
            {heading}
          </h2>

          {/* Paragraph */}
          <p style={{
            margin: '0 0 20px',
            font: `400 14.5px/1.55 ${F.body}`,
            color: 'rgba(245,241,236,.72)',
          }}>
            Cargamos el resto de tu pedido en el menú. Agrega los que quieras para compensar.
          </p>

          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
            {items.map((item, i) => (
              <div key={i} className="unacc-list-row">
                <span style={{
                  font: `400 14px/1 ${F.body}`,
                  color: 'rgba(245,241,236,.45)',
                  textDecoration: 'line-through',
                }}>
                  {item.name}{item.sizeName ? ` · ${item.sizeName}` : ''}
                </span>
                <span style={{
                  font: `600 13px/1 ${F.body}`,
                  color: 'rgba(245,241,236,.45)',
                  flexShrink: 0, marginLeft: 12,
                }}>
                  ×{item.qty}
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            className="unacc-cta"
            onClick={onClose}
            style={{
              width: '100%',
              border: 0, borderRadius: 9,
              background: '#F79138', color: '#17140f',
              font: `700 19px/1 ${F.display}`,
              letterSpacing: '.09em', textTransform: 'uppercase',
              padding: '16px 0', cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(247,145,56,.2)',
            }}
          >
            Entendido, ir al menu
          </button>

        </div>
      </div>
    </>
  )
}
