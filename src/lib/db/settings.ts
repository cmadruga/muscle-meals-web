import { createAdminClient } from '@/lib/supabase/admin'

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
 * Lee el mensaje de pausa (mostrado en el popup del menu).
 */
export async function getSalesPauseMessage(): Promise<string> {
  try {
    const { data, error } = await createAdminClient()
      .from('site_settings')
      .select('value')
      .eq('key', 'sales_pause_message')
      .single()

    if (error || !data) return ''
    return typeof data.value === 'string' ? data.value : String(data.value ?? '')
  } catch {
    return ''
  }
}

/**
 * Guarda el mensaje de pausa.
 */
export async function setSalesPauseMessage(message: string): Promise<void> {
  await createAdminClient()
    .from('site_settings')
    .upsert({ key: 'sales_pause_message', value: message.trim(), updated_at: new Date().toISOString() })
}
