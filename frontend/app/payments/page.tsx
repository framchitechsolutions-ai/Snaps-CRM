'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { CreditCard, Clock, CheckCircle, Wallet, MoreVertical } from 'lucide-react'
import Sidebar from '../../components/layout/Sidebar'
import DashboardHeader from '../../components/layout/DashboardHeader'
import StatCard from '../../components/common/StatCard'
import { useAuthStore } from '../../lib/store'
import { useToastStore } from '../../lib/toast'
import { requestsApi, ProjectRequest } from '../../lib/requests'

function formatPrice(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value
  return `K${isNaN(n) ? '0' : n.toLocaleString()}`
}

const statusBadge: Record<string, string> = {
  success: 'bg-success/10 text-success',
  initiated: 'bg-warning/10 text-warning',
  failed: 'bg-danger/10 text-danger',
  refunded: 'bg-purple/10 text-purple',
}

interface TransactionRow {
  id: string
  request: string
  amount: string
  method: string
  status: string
  date: string
}

const transactions: TransactionRow[] = [
  { id: 'TXN-10241', request: 'Structural drawings review', amount: 'K2,400.00', method: 'Card', status: 'success', date: '12 Jun 2026' },
  { id: 'TXN-10238', request: 'Cost estimation report', amount: 'K1,200.00', method: 'Mobile Money', status: 'success', date: '09 Jun 2026' },
  { id: 'TXN-10235', request: 'DWG review package', amount: 'K3,500.00', method: 'Card', status: 'initiated', date: '07 Jun 2026' },
  { id: 'TXN-10229', request: 'BOQ preparation', amount: 'K950.00', method: 'Bank Transfer', status: 'failed', date: '03 Jun 2026' },
  { id: 'TXN-10218', request: 'Work schedule', amount: 'K1,800.00', method: 'Card', status: 'refunded', date: '28 May 2026' },
]

export default function PaymentsPage() {
  const { user } = useAuthStore()
  const { addToast } = useToastStore()
  const [outstanding, setOutstanding] = useState<ProjectRequest[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const mine = await requestsApi.listMine()
      setOutstanding(mine.filter((r) => r.status === 'awaiting_payment'))
    } catch {
      addToast('Failed to load payments.', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    load()
  }, [load])

  const role = user?.user_type || 'customer'

  const metrics = [
    { title: 'Total Spent', value: 'K12,450', change: '+8.7%', trend: 'up' as const, icon: Wallet, color: 'border-primary', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
    { title: 'Pending Payments', value: String(outstanding.length), change: '-2.4%', trend: 'down' as const, icon: Clock, color: 'border-warning', iconBg: 'bg-warning/10', iconColor: 'text-warning' },
    { title: 'Completed', value: '18', change: '+5.3%', trend: 'up' as const, icon: CheckCircle, color: 'border-success', iconBg: 'bg-success/10', iconColor: 'text-success' },
    { title: 'This Month', value: 'K4,200', change: '+12.1%', trend: 'up' as const, icon: CreditCard, color: 'border-purple', iconBg: 'bg-purple/10', iconColor: 'text-purple' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userType={role} />
      <div className="lg:ml-[246px]">
        <DashboardHeader />
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Payments</h2>
            <p className="text-gray-500 mt-1">Track your transactions and settle outstanding requests.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metrics.map((m) => (
              <StatCard key={m.title} {...m} />
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-card overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Outstanding Payments</h3>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>
            {loading ? (
              <p className="px-6 py-6 text-sm text-gray-400">Loading…</p>
            ) : outstanding.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-gray-500">You have no outstanding payments. 🎉</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/80">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Request</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Provider</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {outstanding.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{req.title}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {req.assigned_provider
                            ? `${req.assigned_provider.first_name} ${req.assigned_provider.last_name}`
                            : 'Unassigned'}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {formatPrice(req.selected_services.reduce((s, x) => s + (parseFloat(x.price) || 0), 0))}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
                            Awaiting Payment
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/requests/${req.id}`}
                            className="inline-flex items-center px-3 py-1.5 bg-purple text-white rounded-lg text-sm font-medium hover:bg-purple/90 transition-colors"
                          >
                            Pay now
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Transaction History</h3>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Request</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{t.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{t.request}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{t.amount}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{t.method}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge[t.status]}`}>
                          {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{t.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">Showing {transactions.length} transactions</p>
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
    </div>
  )
}
