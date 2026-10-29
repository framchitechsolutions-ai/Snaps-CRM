'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Shield, User as UserIcon, Hash } from 'lucide-react'
import Sidebar from '../../components/layout/Sidebar'
import DashboardHeader from '../../components/layout/DashboardHeader'
import { useAuthStore } from '../../lib/store'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isAuthenticated) router.replace('/auth/login')
  }, [mounted, isAuthenticated, router])

  
  if (!mounted || !isAuthenticated) {
    return <div className="min-h-screen bg-background" />
  }

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ')
  const initial = (user?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()

  const details = [
    { icon: UserIcon, label: 'First name', value: user?.first_name },
    { icon: UserIcon, label: 'Last name', value: user?.last_name },
    { icon: Mail, label: 'Email', value: user?.email },
    { icon: Shield, label: 'Account type', value: user?.user_type, capitalize: true },
    { icon: Hash, label: 'User ID', value: user?.id },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-[246px]">
        <DashboardHeader />
        <main className="p-6 lg:p-8 max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">My Profile</h2>
          <p className="text-sm text-gray-600 mb-6">Your account details.</p>

          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
            <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple flex items-center justify-center text-white font-semibold text-2xl">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-semibold text-gray-800 truncate">
                  {fullName || user?.email || 'User'}
                </p>
                <p className="text-sm text-gray-600 capitalize">{user?.user_type || 'User'}</p>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
              {details.map(({ icon: Icon, label, value, capitalize }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-lg bg-gray-100 text-gray-600">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</dt>
                    <dd className={`text-sm font-medium text-gray-800 break-words ${capitalize ? 'capitalize' : ''}`}>
                      {value !== undefined && value !== '' ? String(value) : '—'}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </main>
      </div>
    </div>
  )
}
