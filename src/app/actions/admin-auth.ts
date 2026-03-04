'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function adminLogin(token: string): Promise<{ error: string } | void> {
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return { error: 'Token incorrecto' }
  }

  const cookieStore = await cookies()
  cookieStore.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 días
    path: '/',
    sameSite: 'lax'
  })

  redirect('/panel/orders')
}

export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('admin_token')
  redirect('/panel/login')
}
