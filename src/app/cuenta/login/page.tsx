import { Suspense } from 'react'
import LoginClient from './LoginClient'

export default function CuentaLoginPage() {
  return (
    <Suspense>
      <LoginClient />
    </Suspense>
  )
}
