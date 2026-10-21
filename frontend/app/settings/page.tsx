'use client'

import React, { useState } from 'react'
import { User, Mail, Save } from 'lucide-react'
import Sidebar from '../../components/layout/Sidebar'
import DashboardHeader from '../../components/layout/DashboardHeader'
import { useAuthStore } from '../../lib/store'
import { useToastStore } from '../../lib/toast'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const { addToast } = useToastStore()
  const [firstName, setFirstName] = useState(user?.first_name || '')
  const [lastName, setLastName] = useState(user?.last_name || '')
  const [email, setEmail] = useState(user?.email || '')

  const role = user?.user_type || 'customer'

  const onSave = (e: React.FormEvent) => {
    e.preventDefault()
    addToast('Profile updated.', 'success')
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userType={role} />
      <div className="lg:ml-[246px]">
        <DashboardHeader />
        <main className="p-6 lg:p-8 max-w-3xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <p className="text-gray-500 mt-1">Manage your account preferences.</p>
          </div>

          <form onSubmit={onSave} className="bg-white rounded-xl shadow-card p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-purple flex items-center justify-center text-white font-semibold">
                {(user?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.email || 'User'}
                </p>
                <p className="text-xs text-gray-500 capitalize">{role}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">First name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Last name</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
              >
                <Save size={16} /> Save changes
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}
