'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { FileText, FolderOpen, Loader2, Download, CheckCircle } from 'lucide-react'
import Sidebar from '../../components/layout/Sidebar'
import DashboardHeader from '../../components/layout/DashboardHeader'
import { useAuthStore } from '../../lib/store'
import { useToastStore } from '../../lib/toast'
import { requestsApi, ProjectRequest } from '../../lib/requests'

interface DeliverableRow {
  id: number
  name: string
  requestId: number
  requestTitle: string
  service: string
  completed: boolean
}

const serviceBadge: Record<string, string> = {
  boq: 'bg-primary/10 text-primary',
  work_schedule: 'bg-purple/10 text-purple',
  dwg_review: 'bg-warning/10 text-warning',
  cost_estimation: 'bg-success/10 text-success',
}

export default function DeliverablesPage() {
  const { user } = useAuthStore()
  const { addToast } = useToastStore()
  const [rows, setRows] = useState<DeliverableRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      const mine: ProjectRequest[] = await requestsApi.listProvider()
      const flat: DeliverableRow[] = []
      mine.forEach((r) =>
        r.selected_services.forEach((ss) =>
          ss.deliverables.forEach((d) =>
            flat.push({
              id: d.id,
              name: d.original_filename,
              requestId: r.id,
              requestTitle: r.title,
              service: ss.service.name,
              completed: ss.status === 'completed',
            })
          )
        )
      )
      setRows(flat)
    } catch {
      addToast('Failed to load deliverables.', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    load()
  }, [load])

  const download = async (requestId: number, deliverableId: number) => {
    setBusyId(deliverableId)
    try {
      const { download_url } = await requestsApi.getDeliverableDownloadUrl(requestId, deliverableId)
      window.open(download_url, '_blank', 'noopener,noreferrer')
    } catch {
      addToast('Could not generate download link.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userType="provider" />
      <div className="lg:ml-[246px]">
        <DashboardHeader />
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Deliverables</h2>
            <p className="text-gray-500 mt-1">Deliverables you&apos;ve submitted across assigned projects.</p>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="animate-spin" size={18} /> Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="bg-surface rounded-xl shadow-card p-12 text-center">
              <FolderOpen className="mx-auto text-gray-300" size={42} />
              <p className="mt-4 text-gray-500">No deliverables submitted yet.</p>
              <Link
                href="/requests/provider"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
              >
                Go to Projects
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Submitted Deliverables</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/80">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">File</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Project</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Service</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-success/10 flex items-center justify-center text-success">
                              <FileText size={16} />
                            </div>
                            <span className="font-medium text-gray-900 truncate max-w-[220px]">{row.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <Link href={`/requests/${row.requestId}`} className="hover:text-primary transition-colors">
                            {row.requestTitle}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{row.service}</span>
                        </td>
                        <td className="px-6 py-4">
                          {row.completed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                              <CheckCircle size={13} /> Accepted
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
                              Pending Review
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => download(row.requestId, row.id)}
                            disabled={busyId === row.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {busyId === row.id ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                            Download
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
