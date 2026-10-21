'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { FolderOpen, Loader2, UserPlus, Check, X } from 'lucide-react'
import Sidebar from '../../../components/layout/Sidebar'
import DashboardHeader from '../../../components/layout/DashboardHeader'
import { useAuthStore } from '../../../lib/store'
import { useToastStore } from '../../../lib/toast'
import { adminApi, type ProviderSummary } from '../../../lib/admin'
import { requestsApi, ProjectRequest } from '../../../lib/requests'
import { statusBadgeClass, statusLabel } from '../../../lib/status'

function formatPrice(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value
  return `K${isNaN(n) ? '0' : n.toLocaleString()}`
}

export default function AdminRequestsPage() {
  const { user } = useAuthStore()
  const { addToast } = useToastStore()
  const [requests, setRequests] = useState<ProjectRequest[]>([])
  const [providers, setProviders] = useState<ProviderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [drafts, setDrafts] = useState<Record<number, number | ''>>({})

  const load = useCallback(async () => {
    try {
      const [reqs, pros] = await Promise.all([adminApi.listRequests(), adminApi.listProviders()])
      setRequests(reqs)
      setProviders(pros)
      const init: Record<number, number | ''> = {}
      reqs.forEach((r) => (init[r.id] = r.assigned_provider?.id ?? ''))
      setDrafts(init)
    } catch {
      addToast('Failed to load requests.', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    load()
  }, [load])

  const assign = async (req: ProjectRequest) => {
    const providerId = drafts[req.id]
    if (!providerId) {
      addToast('Select a provider first.', 'error')
      return
    }
    setBusyId(req.id)
    try {
      await adminApi.assignProvider(req.id, Number(providerId), 'in_progress')
      addToast('Provider assigned. Request moved to In Progress.', 'success')
      await load()
    } catch {
      addToast('Assignment failed.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const unassigned = requests.filter((r) => !r.assigned_provider).length

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userType="admin" />
      <div className="lg:ml-[246px]">
        <DashboardHeader />
        <main className="p-6 lg:p-8">
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Request Assignment</h2>
              <p className="text-gray-500 mt-1">
                {unassigned} unassigned · assign providers and move requests into progress.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="animate-spin" size={18} /> Loading…
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-surface rounded-xl shadow-card p-12 text-center">
              <FolderOpen className="mx-auto text-gray-300" size={42} />
              <p className="mt-4 text-gray-500">No requests on the platform yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/80">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Request</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Services</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assign Provider</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <Link href={`/requests/${req.id}`} className="font-medium text-gray-900 hover:text-primary transition-colors">
                            {req.title}
                          </Link>
                          <p className="text-xs text-gray-400">#{req.id}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {req.customer.first_name} {req.customer.last_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {req.selected_services.length} · {formatPrice(req.selected_services.reduce((s, x) => s + (parseFloat(x.price) || 0), 0))}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClass(req.status)}`}>
                            {statusLabel(req.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={drafts[req.id] ?? ''}
                            onChange={(e) => setDrafts((d) => ({ ...d, [req.id]: e.target.value === '' ? '' : Number(e.target.value) }))}
                            className="w-full max-w-[200px] px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          >
                            <option value="">Unassigned</option>
                            {providers.map((p) => (
                              <option key={p.user.id} value={p.user.id}>
                                {p.company_name || `${p.user.first_name} ${p.user.last_name}`.trim() || p.user.email}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => assign(req)}
                            disabled={busyId === req.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                          >
                            {busyId === req.id ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                            Assign
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
