'use client'

import React, { useState } from 'react'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useToastStore } from '../../../lib/toast'

export default function ForgotPasswordPage() {
  const { addToast } = useToastStore()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      addToast('Please enter your email.', 'error')
      return
    }
    // No backend endpoint yet — simulate the request.
    setSent(true)
    addToast('If that email exists, a reset link has been sent.', 'success')
  }

  return (
    <div className="min-h-screen flex bg-background">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-surface rounded-3xl shadow-elevated p-8 sm:p-10">
          <h1 className="text-4xl font-bold tracking-wider text-sidebar">RESET</h1>
          <p className="mt-2 text-sm text-gray-500">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>

          {sent ? (
            <div className="mt-8 flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center text-success">
                <CheckCircle size={28} />
              </div>
              <p className="text-sm text-gray-600">
                We&apos;ve sent a password reset link to <span className="font-medium text-gray-900">{email}</span>.
              </p>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:text-primary-dark"
              >
                <ArrowLeft size={16} /> Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pb-2 bg-transparent border-b-2 border-gray-200 focus:border-primary outline-none text-gray-800 placeholder-gray-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Send reset link
              </button>

              <p className="text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:text-primary-dark"
                >
                  <ArrowLeft size={16} /> Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 bg-sidebar relative overflow-hidden items-center justify-center">
        <svg
          className="absolute left-0 top-0 h-full w-24 text-background"
          viewBox="0 0 100 1000"
          preserveAspectRatio="none"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M0,0 C55,220 55,780 0,1000 L0,1000 L0,0 Z" />
        </svg>
        <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
          <circle cx="120" cy="140" r="60" fill="none" stroke="#3B82F6" strokeWidth="2" opacity="0.4" />
          <circle cx="520" cy="420" r="90" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.25" />
          <polygon points="640,120 690,210 590,210" fill="none" stroke="#3B82F6" strokeWidth="2" opacity="0.4" />
        </svg>
        <div className="relative z-10 text-center px-10">
          <h2 className="text-5xl font-bold tracking-wide text-white">DCMT</h2>
          <p className="mt-4 text-lg text-gray-300 max-w-sm mx-auto">
            Document Management &amp; Technical Services Platform
          </p>
        </div>
      </div>
    </div>
  )
}
