'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { CreditCard, Loader2, Check, X, MoreVertical } from 'lucide-react'
import Sidebar from '../../../components/layout/Sidebar'
import DashboardHeader from '../../../components/layout/DashboardHeader'
import StatCard from '../../../components/common/StatCard'
import { useToastStore } from '../../../lib/toast'
import { adminApi, type AdminTransaction } from '../../../lib/admin'

const statusBadge: Record<string, string> = {
  success: 'bg-success/10 text-success',
  initiated: 'bg-warning/10 text-warning',
  failed: 'bg-danger/10 text-danger',
  refunded: 'bg-purple/10 text-purple',
}

function formatPrice(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value
  return `K${isNaN(n) ? '0' : n.toLocaleString()}`
}

export default function AdminTransactionsPage() {
  const { addToast } = useToastStore()
  const [txns, setTxns] = useState<AdminTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      setTxns(await adminApi.listTransactions())
    } catch {
      addToast('Failed to load transactions.', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    load()
  }, [load])

  const act = async (tx: AdminTransaction, action: 'approve' | 'reject') => {
    setBusyId(tx.id)
    try {
      await adminApi.transactionAction(tx.id, action)
      addToast(action === 'approve' ? 'Transaction approved.' : 'Transaction rejected.', 'success')
      await load()
    } catch {
      addToast('Action failed.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const pending = txns.filter((t) => t.status === 'initiated').length
  const success = txns.filter((t) => t.status === 'success').length
  const failed = txns.filter((t) => t.status === 'failed').length

  const metrics = [
    { title: 'Pending Review', value: String(pending), change: '', trend: 'up' as const, icon: CreditCard, color: 'border-warning', iconBg: 'bg-warning/10', iconColor: 'text-warning' },
    { title: 'Successful', value: String(success), change: '', trend: 'up' as const, icon: Check, color: 'border-success', iconBg: 'bg-success/10', iconColor: 'text-success' },
    { title: 'Failed / Rejected', value: String(failed), change: '', trend: 'down' as const, icon: X, color: 'border-danger', iconBg: 'bg-danger/10', iconColor: 'text-danger' },
    { title: 'Total', value: String(txns.length), change: '', trend: 'up' as const, icon: CreditCard, color: 'border-purple', iconBg: 'bg-purple/10', iconColor: 'text-purple' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userType="admin" />
      <div className="lg:ml-[246px]">
        <DashboardHeader />
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Transaction Review</h2>
            <p className="text-gray-500 mt-1">Approve or reject payments and release provider payouts.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metrics.map((m) => (
              <StatCard key={m.title} {...m} />
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">All Transactions</h3>
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
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Request</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {txns.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                          No transactions yet.
                        </td>
                      </tr>
                    ) : (
                      txns.map((tx) => {
                        const canAct = tx.status === 'initiated'
                        return (
                          <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900">#{tx.id}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{tx.customer_email}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {tx.request ? (
                                <span>
                                  {tx.request.title}
                                  <span className="block text-xs text-gray-400">#{tx.request.id}</span>
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                              {formatPrice(tx.amount)} {tx.currency}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 capitalize">{tx.payment_method}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge[tx.status] || 'bg-gray-100 text-gray-600'}`}>
                                {tx.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => act(tx, 'approve')}
                                  disabled={!canAct || busyId === tx.id}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/10 text-success rounded-lg text-sm font-medium hover:bg-success/20 transition-colors disabled:opacity-40"
                                >
                                  {busyId === tx.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                  Approve
                                </button>
                                <button
                                  onClick={() => act(tx, 'reject')}
                                  disabled={!canAct || busyId === tx.id}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-danger/10 text-danger rounded-lg text-sm font-medium hover:bg-danger/20 transition-colors disabled:opacity-40"
                                >
                                  <X size={14} />
                                  Reject
                                </button>
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
    </div>
  )
}
