'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderOpen,
  CreditCard,
  MessageSquare,
  FileText,
  HelpCircle,
  Settings,
  Bell,
  ChevronLeft,
  Users,
} from 'lucide-react'
import { useAuthStore } from '../../lib/store'

interface SidebarProps {
  userType?: string
}

interface NavItem {
  icon: any
  label: string
  href: string
  badge?: number
}

export default function Sidebar({ userType }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuthStore()

  const role = userType || user?.user_type || 'customer'

  const menuItems: Record<string, NavItem[]> = {
    customer: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/customer/dashboard' },
      { icon: FolderOpen, label: 'Requests', href: '/requests' },
      { icon: CreditCard, label: 'Payments', href: '/payments' },
      { icon: FileText, label: 'Documents', href: '/documents' },
      { icon: MessageSquare, label: 'Messages', href: '/messaging' },
    ],
    provider: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/provider/dashboard' },
      { icon: FolderOpen, label: 'Projects', href: '/requests/provider' },
      { icon: CreditCard, label: 'Invoices', href: '/invoices', badge: 3 },
      { icon: MessageSquare, label: 'Messages', href: '/messaging' },
      { icon: FileText, label: 'Deliverables', href: '/deliverables' },
    ],
    admin: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
      { icon: FolderOpen, label: 'Assign Requests', href: '/admin/requests' },
      { icon: CreditCard, label: 'Transactions', href: '/admin/transactions' },
      { icon: Users, label: 'Users', href: '/users' },
      { icon: MessageSquare, label: 'Messages', href: '/messaging' },
    ],
  }

  const items = menuItems[role as keyof typeof menuItems] || menuItems.customer
  const helpItems = [
    { icon: HelpCircle, label: 'Help & Support', href: '/support' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ]

  const isActive = (href: string) => (pathname || '') === href || (pathname || '').startsWith(href)

  return (
    <div className="fixed left-0 top-0 h-screen w-[246px] bg-[#1F2937] text-white flex flex-col z-50 shadow-elevated">
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="font-bold text-lg tracking-tight">DCMT</span>
        </div>
        <button className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white">
          <ChevronLeft size={16} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-6">
          <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Main Menu</p>
          <ul className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                      active
                        ? 'bg-gray-700 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon size={20} className={active ? 'text-primary' : 'text-gray-400 group-hover:text-gray-200'} />
                    <span className="text-[14px] font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-danger text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        <div>
          <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Help & Support</p>
          <ul className="space-y-1">
            {helpItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                      isActive(item.href)
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon size={20} className="text-gray-400 group-hover:text-gray-200" />
                    <span className="text-[14px] font-medium">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple flex items-center justify-center text-white font-semibold text-sm">
            {(user?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.email || 'User'}
            </p>
            <p className="text-xs text-gray-400 capitalize">{role}</p>
          </div>
        </div>
      </div>
    </div>
  )
}