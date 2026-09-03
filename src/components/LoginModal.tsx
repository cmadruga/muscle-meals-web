'use client'

import Modal from './Modal'
import LoginForm from './LoginForm'
import { colors } from '@/lib/theme'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  redirectTo?: string
  title?: string
  description?: string
}

export default function LoginModal({ isOpen, onClose, redirectTo, title, description }: LoginModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div style={{ padding: '40px 36px 36px' }}>
        <p style={{ color: colors.orange, fontWeight: 700, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10, textAlign: 'center' }}>
          Muscle Meals
        </p>
        <h2 style={{ color: colors.white, fontSize: 20, fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>
          {title ?? 'Inicia sesión'}
        </h2>
        <p style={{ color: colors.textMuted, fontSize: 13, marginBottom: 24, lineHeight: 1.5, textAlign: 'center' }}>
          {description ?? 'Guarda tu historial de órdenes y accede rápido a tu información.'}
        </p>

        <LoginForm
          next={redirectTo ?? '/cuenta'}
          onSuccess={onClose}
        />
      </div>
    </Modal>
  )
}
