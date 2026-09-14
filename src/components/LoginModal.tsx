'use client'

import Modal from './Modal'
import LoginForm from './LoginForm'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  redirectTo?: string
  context?: 'reorder'
  /** Ignored — LoginForm owns the card title */
  title?: string
  /** Ignored — LoginForm owns the card description */
  description?: string
}

export default function LoginModal({ isOpen, onClose, redirectTo, context }: LoginModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <LoginForm
        next={redirectTo}
        onSuccess={onClose}
        onClose={onClose}
        context={context}
      />
    </Modal>
  )
}
