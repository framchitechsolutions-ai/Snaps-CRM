---'use client'

import React, { useState, useEffect } from 'react'
import { Users, UserCheck, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight, MoreVertical, UserPlus, FolderOpen, ShieldCheck } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import Link from 'next/link'
import Sidebar from '../../../components/layout/Sidebar'
import DashboardHeader from '../../../components/layout/DashboardHeader'
import CreateUserModal from '../../../components/common/CreateUserModal'
import { useToastStore } from '../../../lib/toast'
import { adminApi } from '../../../lib/admin'

const transactionData = [
  { name: 'Mon', amount: 4000 },
  { name: 'Tue', amount: 3000 },
  { name: 'Wed', amount: 5000 },
  { name: 'Thu', amount: 4500 },
  { name: 'Fri', amount: 6000 },
  { name: 'Sat', amount: 5500 },
  { name: 'Sun', amount: 7000 },
]

const paymentStatusData = [
  { name: 'Success', value: 156, color: '#10B981' },
  { name: 'Pending', value: 42, color: '#F97316' },
  { name: 'Failed', value: 23, color: '#EF4444' },
  { name: 'Refunded', value: 8, color: '#8B5CF6' },
]

interface UserActivityItem {
  id: number
  name: string
  email: string
  role: string
  status: string
  joined: string
  avatar: string
  statusColor: string
}

const recentUsers: UserActivityItem[] = [
  { id: 1, name: 'John Smith', email: 'john@example.com', role: 'Provider', status: 'Active', joined: '2 min ago', avatar: 'JS', statusColor: 'bg-success/10 text-success' },
  { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com', role: 'Customer', status: 'Pending', joined: '15 min ago', avatar: 'SJ', statusColor: 'bg-warning/10 text-warning' },
  { id: 3, name: 'Michael Chen', email: 'michael@example.com', role: 'Provider', status: 'Active', joined: '1 hour ago', avatar: 'MC', statusColor: 'bg-success/10 text-success' },
  { id: 4, name: 'Emily Davis', email: 'emily@example.com', role: 'Customer', status: 'Active', joined: '3 hours ago', avatar: 'ED', statusColor: 'bg-success/10 text-success' },
  { id: 5, name: 'Robert Wilson', email: 'robert@example.com', role: 'Provider', status: 'Suspended', joined: '5 hours ago', avatar: 'RW', statusColor: 'bg-danger/10 text-danger' },
]

const metrics = [
  {
    title: 'Total Users',
    value: '2,847',
    change: '+12.3%',
    trend: 'up',
    icon: Users,
    color: 'border-primary',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  {
    title: 'Active Providers',
    value: '486',
    change: '+8.1%',
    trend: 'up',
    icon: UserCheck,
    color: 'border-success',
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
  },
  {
    title: 'Total Transactions',
    value: 'K284,000',
    change: '+15.4%',
    trend: 'up',
    icon: CreditCard,
    color: 'border-purple',
    iconBg: 'bg-purple/10',
    iconColor: 'text-purple',
  },
  {
    title: 'Pending Approvals',
    value: '23',
    change: '-5.2%',
    trend: 'down',
    icon: TrendingUp,
    color: 'border-warning',
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
  },
]

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const { addToast } = useToastStore()
  const [unassigned, setUnassigned] = useState(0)
  const [pendingTx, setPendingTx] = useState(0)

  useEffect(() => {
    ;(async () => {
      try {
        const [reqs, txns] = await Promise.all([adminApi.listRequests(), adminApi.listTransactions()])
        setUnassigned(reqs.filter((r) => !r.assigned_provider).length)
        setPendingTx(txns.filter((t) => t.status === 'initiated').length)
      } catch {
        /* ignore — dashboard still renders */
      }
    })()
  }, [])

  const workflows = [
    {
      label: 'Assign Requests',
      desc: 'Assign providers and move requests into progress.',
      href: '/admin/requests',
      icon: FolderOpen,
      count: unassigned,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      label: 'Review Transactions',
      desc: 'Approve or reject payments and release payouts.',
      href: '/admin/transactions',
      icon: CreditCard,
      count: pendingTx,
      color: 'text-purple',
      bg: 'bg-purple/10',
    },
    {
      label: 'Manage Users',
      desc: 'Create, approve or suspend platform users.',
      href: '/users',
      icon: Users,
      count: null,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userType="admin" />

      <div className="lg:ml-[246px]">
        <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="p-6 lg:p-8">
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
              <p className="text-gray-500 mt-1">Manage users, monitor payments, and oversee platform health.</p>
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
            >
              <UserPlus size={16} /> Create User
            </button>
          </div>

          {/* Workflow quick actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {workflows.map((w) => {
              const Icon = w.icon
              return (
                <Link
                  key={w.href}
                  href={w.href}
                  className="bg-white rounded-xl shadow-card p-6 border border-gray-100 hover:shadow-elevated transition-shadow flex items-center gap-4"
                >
                  <div className={`w-12 h-12 rounded-xl ${w.bg} flex items-center justify-center ${w.color}`}>
                    <Icon size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{w.label}</p>
                    <p className="text-sm text-gray-500 truncate">{w.desc}</p>
                  </div>
                  {w.count !== null && (
                    <span className={`ml-auto inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-xs font-bold ${w.bg} ${w.color}`}>
                      {w.count}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metrics.map((metric, index) => {
              const Icon = metric.icon
              return (
                <div
                  key={index}
                  className={`bg-white rounded-xl shadow-card p-6 border-l-[4px] ${metric.color} hover:shadow-elevated transition-shadow duration-200`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${metric.iconBg}`}>
                      <Icon size={22} className={metric.iconColor} />
                    </div>
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">{metric.title}</p>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                    <div className={`flex items-center gap-1 text-sm font-medium ${metric.trend === 'up' ? 'text-success' : 'text-danger'}`}>
                      {metric.trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      {metric.change}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Payment Status</h3>
                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {paymentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #E5E7EB',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Platform Revenue</h3>
                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={transactionData}>
                    <defs>
                      <linearGradient id="colorPlatformRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      tickFormatter={(value) => `K${value / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #E5E7EB',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      formatter={(value: any) => [`K${Number(value).toLocaleString()}`, 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorPlatformRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Recent User Activity</h3>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  Filter
                </button>
                <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-700 font-semibold text-xs">
                            {user.avatar}
                          </div>
                          <span className="font-medium text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="capitalize">{user.role}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${user.statusColor}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{user.joined}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">Showing 5 of 86 users</p>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  Previous
                </button>
                <button className="px-3 py-1.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {createOpen && (
        <CreateUserModal onClose={() => setCreateOpen(false)} onCreated={() => {}} />
      )}
    </div>
  )
}