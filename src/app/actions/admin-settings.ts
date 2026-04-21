'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { setSalesEnabled, setSalesPauseMessage } from '@/lib/db/settings'

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

export async function saveSalesPauseMessage(message: string): Promise<void> {
  await checkAdmin()
  await setSalesPauseMessage(message)
  revalidatePath('/menu')
}
