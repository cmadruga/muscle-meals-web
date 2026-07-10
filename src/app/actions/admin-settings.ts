'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { setSalesEnabled, setCriticalPeriodConfig, setShippingStandard } from '@/lib/db/settings'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CriticalPeriodConfig } from '@/lib/utils/delivery'

async function checkAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token || token !== process.env.ADMIN_TOKEN) {
    throw new Error('No autorizado')
  }
}

export async function toggleSalesEnabled(enabled: boolean): Promise<void> {
  await checkAdmin()
  await setSalesEnabled(enabled)
  revalidatePath('/admin/orders')
  revalidatePath('/menu')
  revalidatePath('/package')
}

export async function updateCriticalPeriodConfig(config: CriticalPeriodConfig): Promise<void> {
  await checkAdmin()
  await setCriticalPeriodConfig(config)
  revalidatePath('/admin/orders')
}

export async function updateShippingStandard(cents: number): Promise<{ error?: string }> {
  try {
    await checkAdmin()
    await setShippingStandard(cents)
    revalidatePath('/admin/orders')
    revalidatePath('/checkout')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error' }
  }
}

export async function updateSizePrice(
  sizeId: string,
  price: number,
  packagePrice: number,
): Promise<{ error?: string }> {
  try {
    await checkAdmin()
    const { error } = await createAdminClient()
      .from('sizes')
      .update({ price, package_price: packagePrice })
      .eq('id', sizeId)
    if (error) return { error: error.message }
    revalidatePath('/admin/orders')
    revalidatePath('/menu')
    revalidatePath('/package')
    revalidatePath('/checkout')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error' }
  }
}
