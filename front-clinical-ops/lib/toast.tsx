'use client'

import * as React from 'react'
import { Toast } from '@/components/ui/toast'
import { motion, AnimatePresence } from 'motion/react'

export interface ToastData {
  id: string
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info'
  title?: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextValue {
  toasts: ToastData[]
  addToast: (toast: Omit<ToastData, 'id'>) => string
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(
  undefined
)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([])

  const addToast = React.useCallback(
    (toast: Omit<ToastData, 'id'>): string => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast: ToastData = {
        id,
        duration: 5000,
        ...toast,
      }

      setToasts((prev) => [...prev, newToast])

      // Auto-remove after duration
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, newToast.duration)
      }

      return id
    },
    []
  )

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: ToastData[]
  onRemove: (id: string) => void
}) {
  return (
    <div className='fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]'>
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
          >
            <Toast variant={toast.variant} onClose={() => onRemove(toast.id)}>
              <div className='grid gap-1'>
                {toast.title && (
                  <div className='text-sm font-semibold'>{toast.title}</div>
                )}
                {toast.description && (
                  <div className='text-sm opacity-90'>{toast.description}</div>
                )}
                {toast.action && (
                  <button
                    onClick={toast.action.onClick}
                    className='mt-2 inline-flex items-center justify-center rounded-md text-sm font-medium underline underline-offset-4 hover:no-underline'
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
            </Toast>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
