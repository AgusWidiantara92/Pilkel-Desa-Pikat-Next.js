'use client'

import { useEffect, useState, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'warning'

export interface ToastMessage {
  id: string
  type: ToastType
  text: string
}

const icons: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
}

const styles: Record<ToastType, { bg: string; icon: string; text: string; border: string }> = {
  success: {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-500',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
  error: {
    bg: 'bg-red-50',
    icon: 'text-red-500',
    text: 'text-red-800',
    border: 'border-red-200',
  },
  warning: {
    bg: 'bg-amber-50',
    icon: 'text-amber-500',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
}

// ── Hook: useToast ──
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((type: ToastType, text: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    setToasts((prev) => [...prev, { id, type, text }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = {
    success: (text: string) => addToast('success', text),
    error: (text: string) => addToast('error', text),
    warning: (text: string) => addToast('warning', text),
  }

  return { toasts, toast, removeToast }
}

// ── Component: ToastContainer ──
export function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: ToastMessage[]
  removeToast: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  )
}

// ── Component: ToastItem ──
function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage
  onDismiss: (id: string) => void
}) {
  const [exiting, setExiting] = useState(false)
  const s = styles[toast.type]

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true)
      setTimeout(() => onDismiss(toast.id), 250)
    }, 3500)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  const handleDismiss = () => {
    setExiting(true)
    setTimeout(() => onDismiss(toast.id), 250)
  }

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${s.bg} ${s.border} ${
        exiting ? 'animate-toast-out' : 'animate-toast-in'
      }`}
    >
      <span className={`flex-shrink-0 ${s.icon}`}>{icons[toast.type]}</span>
      <p className={`text-sm font-semibold flex-1 ${s.text}`}>{toast.text}</p>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
