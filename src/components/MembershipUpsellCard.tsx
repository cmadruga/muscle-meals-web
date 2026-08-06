'use client'

import Image from 'next/image'
import { colors } from '@/lib/theme'

export function MembershipUpsellCard({
  membershipMode,
  onToggle,
  membershipWeeks,
  onWeeksChange,
  discountMap,
  isRenewal,
}: {
  membershipMode: boolean
  onToggle: () => void
  membershipWeeks: 4 | 8 | 12
  onWeeksChange: (w: 4 | 8 | 12) => void
  discountMap: Record<number, number>
  isRenewal: boolean
}) {
  void isRenewal // available for future use (e.g. different copy)
  return (
    <div style={{
      marginBottom: 16,
      border: `2px solid ${membershipMode ? colors.orange : `${colors.orange}70`}`,
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', position: 'relative', overflow: 'hidden',
          minHeight: 160,
          display: 'flex', alignItems: 'center',
          padding: '20px 24px',
          backgroundImage: 'url(/media/Fondo.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: 'none', cursor: 'pointer', color: colors.white, fontFamily: 'inherit',
        }}
      >
        {/* Corner image — anchored bottom-left, sized to fill card */}
        <Image
          src="/media/Muscle Meals Membership_Corner.png"
          alt=""
          aria-hidden={true}
          width={2419}
          height={1648}
          style={{
            position: 'absolute', bottom: 0, left: 0,
            height: '165%', width: 'auto',
            pointerEvents: 'none',
          }}
        />

        {/* Toggle — far right */}
        <div style={{
          position: 'relative', zIndex: 1,
          width: 56, height: 30, borderRadius: 15, flexShrink: 0, marginLeft: 'auto',
          background: membershipMode ? colors.orange : colors.grayLight,
          transition: 'background 0.2s',
        }}>
          <div style={{
            position: 'absolute', top: 3, left: membershipMode ? 29 : 3,
            width: 24, height: 24, borderRadius: '50%', background: colors.white,
            transition: 'left 0.2s',
          }} />
        </div>
      </button>

      {membershipMode && (
        <div style={{
          padding: '14px 22px',
          backgroundImage: 'url(/media/Fondo.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderTop: `2px solid ${colors.orange}`,
        }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {([4, 8, 12] as const).map(w => (
              <button
                key={w}
                onClick={() => onWeeksChange(w)}
                style={{
                  flex: 1, padding: '14px 0', borderRadius: 8, cursor: 'pointer',
                  border: `2px solid ${membershipWeeks === w ? colors.orange : colors.grayLight}`,
                  background: membershipWeeks === w ? `${colors.orange}22` : 'transparent',
                  color: membershipWeeks === w ? colors.orange : colors.textSecondary,
                  fontFamily: 'inherit', fontSize: 18, fontWeight: 700,
                }}
              >
                {w} sem.
                <br />
                <span style={{ fontSize: 15, fontWeight: 400 }}>−{discountMap[w]}%</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
