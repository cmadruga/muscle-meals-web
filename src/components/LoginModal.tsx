'use client'

import Modal from './Modal'
import LoginForm from './LoginForm'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  redirectTo?: string
  /** Ignored — LoginForm now owns the card title */
  title?: string
  /** Ignored — LoginForm now owns the card description */
  description?: string
}

export default function LoginModal({ isOpen, onClose, redirectTo }: LoginModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <LoginForm
        next={redirectTo ?? '/cuenta'}
        onSuccess={onClose}
        onClose={onClose}
      />
    </Modal>
  )
}
