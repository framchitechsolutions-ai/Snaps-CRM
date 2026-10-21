'use client'

import React, { useState } from 'react'
import { X, UserPlus, Loader2 } from 'lucide-react'
import { useToastStore } from '../../lib/toast'
import { usersApi, type CreateUserPayload, type UserTypeValue } from '../../lib/users'

interface CreateUserModalProps {
  onClose: () => void
  onCreated: () => void
}

const USER_TYPES: { value: UserTypeValue; label: string }[] = [
  { value: 'customer', label: 'Customer' },
  { value: 'provider', label: 'Provider' },
  { value: 'admin', label: 'Admin' },
]

export default function CreateUserModal({ onClose, onCreated }: CreateUserModalProps) {
  const { addToast } = useToastStore()
  const [form, setForm] = useState<CreateUserPayload>({
    email: '',
    password: '',
    user_type: 'customer',
    first_name: '',
    last_name: '',
    phone_number: '',
    company_name: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const update = (key: keyof CreateUserPayload, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const valid = form.email.trim() && form.password.length >= 6 && form.user_type

  const submit = async () => {
    if (!valid) return
    setSubmitting(true)
    try {
      await usersApi.create(form)
      addToast('User created successfully.', 'success')
      onCreated()
      onClose()
    } catch (err: any) {
      const detail =
        err?.response?.data?.email?.[0] ||
        err?.response?.data?.detail ||
        'Could not create user.'
      addToast(detail, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls =
    'w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-surface rounded-2xl shadow-elevated w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <UserPlus size={16} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Create User</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">First name</label>
              <input
                value={form.first_name}
                onChange={(e) => update('first_name', e.target.value)}
                placeholder="Francis"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Last name</label>
              <input
                value={form.last_name}
                onChange={(e) => update('last_name', e.target.value)}
                placeholder="Chiputa"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="fchiputa@gmail.com.com"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password <span className="text-danger">*</span>
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="At least 6 characters"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Account type</label>
            <select
              value={form.user_type}
              onChange={(e) => update('user_type', e.target.value as UserTypeValue)}
              className={inputCls}
            >
              {USER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input
                value={form.phone_number}
                onChange={(e) => update('phone_number', e.target.value)}
                placeholder="+260 ..."
                className={inputCls}
              />
            </div>
            {form.user_type === 'provider' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Company</label>
                <input
                  value={form.company_name}
                  onChange={(e) => update('company_name', e.target.value)}
                  placeholder="Acme Services"
                  className={inputCls}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!valid || submitting}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            Create User
          </button>
        </div>
      </div>
    </div>
  )
}
