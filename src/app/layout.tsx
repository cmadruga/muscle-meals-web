import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

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
        <Navbar />
        <div style={{ paddingTop: 60 }}>
          {children}
        </div>
      </body>
    </html>
  )
}
