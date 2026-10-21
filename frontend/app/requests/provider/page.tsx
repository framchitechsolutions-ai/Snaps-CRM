'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { FolderOpen, Loader2, User as UserIcon } from 'lucide-react'
import Sidebar from '../../../components/layout/Sidebar'
import DashboardHeader from '../../../components/layout/DashboardHeader'
import { useAuthStore } from '../../../lib/store'
import { useToastStore } from '../../../lib/toast'
import { requestsApi, ProjectRequest } from '../../../lib/requests'
import { statusBadgeClass, statusLabel } from '../../../lib/status'

function formatPrice(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value
  return `K${isNaN(n) ? '0' : n.toLocaleString()}`
}

export default function ProviderRequestsPage() {
  const { user } = useAuthStore()
  const { addToast } = useToastStore()
  const [requests, setRequests] = useState<ProjectRequest[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setRequests(await requestsApi.listProvider())
    } catch {
      addToast('Failed to load assigned requests.', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userType="provider" />
      <div className="lg:ml-[246px]">
        <DashboardHeader />
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Assigned Projects</h2>
            <p className="text-gray-500 mt-1">Manage requests assigned to you.</p>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="animate-spin" size={18} /> Loading…
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-surface rounded-xl shadow-card p-12 text-center">
              <FolderOpen className="mx-auto text-gray-300" size={42} />
              <p className="mt-4 text-gray-500">No projects assigned to you yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {requests.map((req) => (
                <Link
                  key={req.id}
                  href={`/requests/${req.id}`}
                  className="bg-surface rounded-xl shadow-card p-6 hover:shadow-elevated transition-shadow border border-gray-100"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <FolderOpen size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{req.title}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <UserIcon size={13} />
                          {req.customer.first_name} {req.customer.last_name}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClass(
                        req.status,
                      )}`}
                    >
                      {statusLabel(req.status)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">{req.description}</p>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {req.selected_services.length} service(s)
                    </span>
                    <span className="text-gray-400">
                      {formatPrice(
                        req.selected_services.reduce((s, x) => s + (parseFloat(x.price) || 0), 0),
                      )}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
