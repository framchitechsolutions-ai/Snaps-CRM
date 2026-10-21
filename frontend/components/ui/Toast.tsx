'use client'

import React from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToastStore, type ToastType } from '../../lib/toast'

const config: Record<
  ToastType,
  { border: string; icon: React.ReactNode; iconColor: string }
> = {
  success: {
    border: 'border-l-success',
    iconColor: 'text-success',
    icon: <CheckCircle className="h-5 w-5 text-success" />,
  },
  error: {
    border: 'border-l-danger',
    iconColor: 'text-danger',
    icon: <XCircle className="h-5 w-5 text-danger" />,
  },
  warning: {
    border: 'border-l-warning',
    iconColor: 'text-warning',
    icon: <AlertTriangle className="h-5 w-5 text-warning" />,
  },
  info: {
    border: 'border-l-primary',
    iconColor: 'text-primary',
    icon: <Info className="h-5 w-5 text-primary" />,
  },
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-[340px] max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => {
        const c = config[toast.type]
        return (
          <div
            key={toast.id}
            role="alert"
            className={`flex items-start gap-3 bg-surface shadow-elevated rounded-xl border-l-4 ${c.border} p-4 animate-[fadeIn_0.2s_ease-out]`}
          >
            <div className="mt-0.5 shrink-0">{c.icon}</div>
            <p className="flex-1 text-sm text-gray-700 leading-snug">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
