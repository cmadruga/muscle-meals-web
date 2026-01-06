import type { Metadata } from 'next'
import './globals.css'
import CartIcon from '@/components/CartIcon'

export const metadata: Metadata = {
  title: 'Muscle Meals',
  description: 'Paquetes de comida preparada para tu semana fitness',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body>
        <CartIcon />
        {children}
      </body>
    </html>
  )
}
