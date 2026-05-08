'use client'

import { useState } from 'react'
import { colors } from '@/lib/theme'
import SalesToggle from './SalesToggle'
import CriticalPeriodConfigPanel from './CriticalPeriodConfig'
import type { CriticalPeriodConfig } from '@/lib/utils/delivery'

export default function SettingsDrawer({
  salesEnabled,
  criticalPeriodConfig,
}: {
  salesEnabled: boolean
  criticalPeriodConfig: CriticalPeriodConfig
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
          border: `1px solid ${colors.grayLight}`,
          background: colors.grayDark, color: colors.textMuted,
          fontSize: 14, fontWeight: 600, transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: 16 }}>⚙</span>
        Configuración
      </button>

      {open && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 400,
              background: 'rgba(0,0,0,0.5)',
            }}
          />

          {/* Drawer */}
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 401,
            width: 440, background: colors.grayDark,
            borderLeft: `2px solid ${colors.grayLight}`,
            display: 'flex', flexDirection: 'column',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px', borderBottom: `1px solid ${colors.grayLight}`,
            }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.white }}>
                Configuración
              </h2>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: colors.textMuted, fontSize: 22, lineHeight: 1, padding: 4,
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

              {/* Ventas */}
              <section style={{ marginBottom: 32 }}>
                <p style={{
                  margin: '0 0 12px', fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: colors.textMuted,
                }}>
                  Ventas
                </p>
                <SalesToggle initialEnabled={salesEnabled} />
              </section>

              <div style={{ height: 1, background: colors.grayLight, marginBottom: 32 }} />

              {/* Período crítico */}
              <section>
                <p style={{
                  margin: '0 0 12px', fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: colors.textMuted,
                }}>
                  Período crítico
                </p>
                <CriticalPeriodConfigPanel initial={criticalPeriodConfig} />
              </section>

            </div>
          </div>
        </>
      )}
    </>
  )
}
