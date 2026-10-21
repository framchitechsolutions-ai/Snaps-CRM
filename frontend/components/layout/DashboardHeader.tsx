'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Search, Bell, Mail, ChevronDown, Menu, LogOut, User as UserIcon } from 'lucide-react'
import { useAuthStore } from '../../lib/store'
import { useToastStore } from '../../lib/toast'
import apiClient from '../../lib/apiClient'
import { useRouter } from 'next/navigation'

interface DashboardHeaderProps {
  onMenuClick?: () => void
}

export default function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { user, refreshToken, logout } = useAuthStore()
  const { addToast } = useToastStore()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const firstName = user?.first_name || 'User'

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout/', { refresh: refreshToken })
      addToast('Logged out successfully.', 'success')
    } catch {
      addToast('Logged out.', 'info')
    } finally {
      logout()
      setMenuOpen(false)
      router.push('/auth/login')
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="flex items-center justify-between px-6 lg:px-8 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Welcome back, {firstName}
            </h1>
            <p className="text-sm text-gray-500">Here&apos;s what&apos;s happening with your account today.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-64"
            />
          </div>

          <button className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full ring-2 ring-white"></span>
          </button>

          <button className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors hidden sm:flex">
            <Mail size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-white"></span>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 pl-3 border-l border-gray-200"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple flex items-center justify-center text-white font-semibold text-sm">
                {(user?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.email || 'User'}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span className="capitalize">{user?.user_type || 'User'}</span>
                  <ChevronDown size={14} />
                </div>
              </div>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-surface rounded-xl shadow-elevated border border-gray-100 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.email || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user?.user_type || 'User'}</p>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <UserIcon size={16} className="text-gray-400" />
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
