'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Users, UserCheck, Check, X, Loader2, MoreVertical, UserPlus } from 'lucide-react'
import Sidebar from '../../components/layout/Sidebar'
import DashboardHeader from '../../components/layout/DashboardHeader'
import StatCard from '../../components/common/StatCard'
import CreateUserModal from '../../components/common/CreateUserModal'
import { useToastStore } from '../../lib/toast'
import apiClient from '../../lib/apiClient'
import { usersApi, type AdminUser } from '../../lib/users'

function rowStatus(u: AdminUser): { label: string; cls: string } {
  if (u.user_type === 'provider') {
    switch (u.verification_status) {
      case 'approved':
        return { label: 'Active', cls: 'bg-success/10 text-success' }
      case 'rejected':
        return { label: 'Suspended', cls: 'bg-danger/10 text-danger' }
      default:
        return { label: 'Pending', cls: 'bg-warning/10 text-warning' }
    }
  }
  if (u.user_type === 'admin') return { label: 'Admin', cls: 'bg-purple/10 text-purple' }
  return { label: 'Customer', cls: 'bg-primary/10 text-primary' }
}

export default function UsersPage() {
  const { addToast } = useToastStore()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      setUsers(await usersApi.list())
    } catch {
      addToast('Failed to load users.', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    load()
  }, [load])

  const setStatus = async (user: AdminUser, status: 'approved' | 'rejected') => {
    setBusyId(user.id)
    try {
      await apiClient.post(`/auth/users/${user.id}/approve/`, { status })
      addToast(`Provider ${status === 'approved' ? 'approved' : 'suspended'}.`, 'success')
      await load()
    } catch {
      addToast('Action failed.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const active = users.filter((u) => u.user_type === 'provider' && u.verification_status === 'approved').length
  const pending = users.filter((u) => u.user_type === 'provider' && u.verification_status === 'pending').length
  const suspended = users.filter((u) => u.user_type === 'provider' && u.verification_status === 'rejected').length

  const metrics = [
    { title: 'Total Users', value: String(users.length), change: '+8.1%', trend: 'up' as const, icon: Users, color: 'border-primary', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
    { title: 'Active Providers', value: String(active), change: '+5.3%', trend: 'up' as const, icon: UserCheck, color: 'border-success', iconBg: 'bg-success/10', iconColor: 'text-success' },
    { title: 'Pending Approvals', value: String(pending), change: '-2.4%', trend: 'down' as const, icon: Check, color: 'border-warning', iconBg: 'bg-warning/10', iconColor: 'text-warning' },
    { title: 'Suspended', value: String(suspended), change: '+1.1%', trend: 'up' as const, icon: X, color: 'border-purple', iconBg: 'bg-purple/10', iconColor: 'text-purple' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userType="admin" />
      <div className="lg:ml-[246px]">
        <DashboardHeader />
        <main className="p-6 lg:p-8">
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <p className="text-gray-500 mt-1">Review and manage all platform users.</p>
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
            >
              <UserPlus size={16} /> Create User
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metrics.map((m) => (
              <StatCard key={m.title} {...m} />
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">All Users</h3>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>
            {loading ? (
              <p className="px-6 py-6 text-sm text-gray-400">Loading…</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/80">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => {
                        const meta = rowStatus(u)
                        const name = `${u.first_name} ${u.last_name}`.trim() || u.email
                        return (
                          <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-purple flex items-center justify-center text-white font-semibold text-xs">
                                  {(u.first_name?.[0] || u.email?.[0] || '?').toUpperCase()}
                                </div>
                                <span className="font-medium text-gray-900">{name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 capitalize">{u.user_type}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${meta.cls}`}>
                                {meta.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{u.date_joined}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                {u.user_type === 'provider' && u.verification_status !== 'approved' && (
                                  <button
                                    onClick={() => setStatus(u, 'approved')}
                                    disabled={busyId === u.id}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/10 text-success rounded-lg text-sm font-medium hover:bg-success/20 transition-colors disabled:opacity-50"
                                  >
                                    {busyId === u.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                    Approve
                                  </button>
                                )}
                                {u.user_type === 'provider' && u.verification_status !== 'rejected' && (
                                  <button
                                    onClick={() => setStatus(u, 'rejected')}
                                    disabled={busyId === u.id}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-danger/10 text-danger rounded-lg text-sm font-medium hover:bg-danger/20 transition-colors disabled:opacity-50"
                                  >
                                    <X size={14} />
                                    Suspend
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {createOpen && (
        <CreateUserModal onClose={() => setCreateOpen(false)} onCreated={load} />
      )}
    </div>
  )
}
