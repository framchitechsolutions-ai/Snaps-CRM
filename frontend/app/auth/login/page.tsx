'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { User, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../../../lib/store'
import { useToastStore } from '../../../lib/toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
})

export default function LoginPage() {
  const { login } = useAuthStore()
  const { addToast } = useToastStore()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
  })

  const onSubmit = async (data: any) => {
    try {
      await login(data.email, data.password)
      const role = useAuthStore.getState().user?.user_type
      const dest =
        role === 'provider'
          ? '/provider/dashboard'
          : role === 'admin'
          ? '/admin/dashboard'
          : '/customer/dashboard'
      router.push(dest)
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        'Login failed. Please check your credentials.'
      addToast(detail, 'error')
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-surface rounded-3xl shadow-elevated p-8 sm:p-10">
          <h1 className="text-4xl font-bold tracking-wider text-sidebar">SIGN IN</h1>
          <p className="mt-2 text-sm text-gray-500">
            Welcome back. Please enter your details.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6" noValidate>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <div className="relative">
                <User className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="fchiputa@gmail.com"
                  className="w-full pl-9 pb-2 bg-transparent border-b-2 border-gray-200 focus:border-primary outline-none text-gray-800 placeholder-gray-400"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 pb-2 bg-transparent border-b-2 border-gray-200 focus:border-primary outline-none text-gray-800 placeholder-gray-400"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" className="accent-primary h-4 w-4" />
                Remember me
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-primary hover:text-primary-dark"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              Sign In
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/signup"
              className="text-primary font-medium hover:text-primary-dark"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right: decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar relative overflow-hidden items-center justify-center">
        {/* Wave divider */}
        <svg
          className="absolute left-0 top-0 h-full w-24 text-background"
          viewBox="0 0 100 1000"
          preserveAspectRatio="none"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M0,0 C55,220 55,780 0,1000 L0,1000 L0,0 Z" />
        </svg>

        {/* Geometric shapes */}
        <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
          <circle cx="120" cy="140" r="60" fill="none" stroke="#3B82F6" strokeWidth="2" opacity="0.4" />
          <circle cx="520" cy="420" r="90" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.25" />
          <polygon points="640,120 690,210 590,210" fill="none" stroke="#3B82F6" strokeWidth="2" opacity="0.4" />
          <path d="M80,520 q40,-40 80,0 t80,0 t80,0" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.25" />
          <path d="M470,640 q40,-40 80,0 t80,0 t80,0" fill="none" stroke="#3B82F6" strokeWidth="2" opacity="0.4" />
          <g stroke="#FFFFFF" strokeWidth="2" opacity="0.25">
            <line x1="560" y1="300" x2="560" y2="340" />
            <line x1="540" y1="320" x2="580" y2="320" />
          </g>
          <g stroke="#3B82F6" strokeWidth="2" opacity="0.4">
            <line x1="180" y1="760" x2="180" y2="800" />
            <line x1="160" y1="780" x2="200" y2="780" />
          </g>
        </svg>

        <div className="relative z-10 text-center px-10">
          <h2 className="text-5xl font-bold tracking-wide text-white">DCMT</h2>
          <p className="mt-4 text-lg text-gray-300 max-w-sm mx-auto">
            Document Management &amp; Technical Services Platform
          </p>
        </div>
      </div>

      <footer className="absolute bottom-4 left-6 text-xs text-gray-400">
        © {new Date().getFullYear()} DCMT. All rights reserved.
      </footer>
    </div>
  )
}
