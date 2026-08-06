import { colors } from '@/lib/theme'

export default function AdminLoading() {
  return (
    <div style={{ color: colors.white }}>
      <style>{`
        @keyframes adm-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.9; }
        }
        .adm-skel {
          background: ${colors.grayLight};
          border-radius: 6px;
          animation: adm-pulse 1.4s ease-in-out infinite;
        }
      `}</style>

      {/* Title bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div className="adm-skel" style={{ height: 32, width: 200 }} />
        <div className="adm-skel" style={{ height: 36, width: 130, animationDelay: '0.1s' }} />
      </div>

      {/* Subtitle */}
      <div className="adm-skel" style={{ height: 16, width: 280, marginBottom: 24, animationDelay: '0.05s' }} />

      {/* Row of chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {[80, 110, 90].map((w, i) => (
          <div key={i} className="adm-skel" style={{ height: 30, width: w, borderRadius: 20, animationDelay: `${i * 0.07}s` }} />
        ))}
      </div>

      {/* Table header */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, padding: '0 4px' }}>
        {[60, 140, 260, 80, 80, 90].map((w, i) => (
          <div key={i} className="adm-skel" style={{ height: 12, width: w, animationDelay: `${i * 0.05}s` }} />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex', gap: 16, alignItems: 'center',
            padding: '14px 4px',
            borderBottom: `1px solid ${colors.grayDark}`,
            animationDelay: `${i * 0.06}s`,
          }}
        >
          {[60, 140, 260, 80, 80, 90].map((w, j) => (
            <div
              key={j}
              className="adm-skel"
              style={{ height: 14, width: w + (i % 3 === 0 ? -10 : i % 3 === 1 ? 10 : 0), animationDelay: `${(i + j) * 0.04}s` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
