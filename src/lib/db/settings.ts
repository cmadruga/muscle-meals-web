import { unstable_noStore as noStore } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { type CriticalPeriodConfig, DEFAULT_CRITICAL_PERIOD } from '@/lib/utils/delivery'

/**
 * Lee si las ventas están habilitadas.
 * Fallback true para no bloquear en caso de error de DB.
 */
export async function getSalesEnabled(): Promise<boolean> {
  try {
    const { data, error } = await createAdminClient()
      .from('site_settings')
      .select('value')
      .eq('key', 'sales_enabled')
      .single()

    if (error || !data) return true
    return data.value === true || data.value === 'true'
  } catch {
    return true
  }
}

/**
 * Actualiza si las ventas están habilitadas.
 */
export async function setSalesEnabled(enabled: boolean): Promise<void> {
  await createAdminClient()
    .from('site_settings')
    .upsert({ key: 'sales_enabled', value: enabled, updated_at: new Date().toISOString() })
}

/**
 * Lee la configuración del periodo crítico.
 */
export async function getCriticalPeriodConfig(): Promise<CriticalPeriodConfig> {
  try {
    const { data, error } = await createAdminClient()
      .from('site_settings')
      .select('value')
      .eq('key', 'critical_period')
      .single()

    if (error || !data) return DEFAULT_CRITICAL_PERIOD
    const v = data.value as Partial<CriticalPeriodConfig>
    return {
      cutoff_day: v.cutoff_day ?? DEFAULT_CRITICAL_PERIOD.cutoff_day,
      cutoff_hour: v.cutoff_hour ?? DEFAULT_CRITICAL_PERIOD.cutoff_hour,
      end_day: v.end_day ?? DEFAULT_CRITICAL_PERIOD.end_day,
    }
  } catch {
    return DEFAULT_CRITICAL_PERIOD
  }
}

/**
 * Guarda la configuración del periodo crítico.
 */
export async function setCriticalPeriodConfig(config: CriticalPeriodConfig): Promise<void> {
  await createAdminClient()
    .from('site_settings')
    .upsert({ key: 'critical_period', value: config, updated_at: new Date().toISOString() })
}

/**
 * Lee el costo de envío estándar en centavos. Default: 4900 ($49 MXN).
 */
export async function getShippingStandard(): Promise<number> {
  noStore()
  try {
    const { data, error } = await createAdminClient()
      .from('site_settings')
      .select('value')
      .eq('key', 'shipping_standard')
      .single()
    if (error || !data) return 4900
    return typeof data.value === 'number' ? data.value : 4900
  } catch {
    return 4900
  }
}

/**
 * Guarda el costo de envío estándar en centavos.
 */
export async function setShippingStandard(cents: number): Promise<void> {
  await createAdminClient()
    .from('site_settings')
    .upsert({ key: 'shipping_standard', value: cents, updated_at: new Date().toISOString() })
}

export type MembershipDiscounts = { w4: number; w8: number; w12: number }

const DEFAULT_MEMBERSHIP_DISCOUNTS: MembershipDiscounts = { w4: 10, w8: 13, w12: 15 }

/**
 * Lee los descuentos por opción de membresía (porcentaje por semanas: 4/8/12).
 */
export async function getMembershipDiscounts(): Promise<MembershipDiscounts> {
  try {
    const { data, error } = await createAdminClient()
      .from('site_settings')
      .select('value')
      .eq('key', 'membership_discounts')
      .single()
    if (error || !data) return DEFAULT_MEMBERSHIP_DISCOUNTS
    const v = data.value as Partial<MembershipDiscounts>
    return {
      w4: v.w4 ?? DEFAULT_MEMBERSHIP_DISCOUNTS.w4,
      w8: v.w8 ?? DEFAULT_MEMBERSHIP_DISCOUNTS.w8,
      w12: v.w12 ?? DEFAULT_MEMBERSHIP_DISCOUNTS.w12,
    }
  } catch {
    return DEFAULT_MEMBERSHIP_DISCOUNTS
  }
}

/**
 * Guarda los descuentos por opción de membresía.
 */
export async function setMembershipDiscounts(discounts: MembershipDiscounts): Promise<void> {
  await createAdminClient()
    .from('site_settings')
    .upsert({ key: 'membership_discounts', value: discounts, updated_at: new Date().toISOString() })
}
