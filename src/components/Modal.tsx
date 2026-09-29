'use client'

import { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      <style>{`
        .mm-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.88);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 24px;
        }
        .mm-modal-inner {
          max-width: 800px;
          width: 100%;
        }
        @media (max-width: 900px) {
          .mm-modal-overlay { padding: 16px; }
          .mm-modal-inner   { max-height: 96dvh; overflow-y: auto; border-radius: 14px; }
        }
      `}</style>

      <div className="mm-modal-overlay" onClick={onClose}>
        <div className="mm-modal-inner" onClick={e => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </>
  )
}
