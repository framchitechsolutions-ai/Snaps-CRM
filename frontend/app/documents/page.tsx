'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { FileText, FolderOpen, Loader2, Paperclip, Download } from 'lucide-react'
import Sidebar from '../../components/layout/Sidebar'
import DashboardHeader from '../../components/layout/DashboardHeader'
import { useAuthStore } from '../../lib/store'
import { useToastStore } from '../../lib/toast'
import { requestsApi, ProjectRequest, AppDocument } from '../../lib/requests'

interface DocRow {
  doc: AppDocument
  requestId: number
  requestTitle: string
}

const typeBadge: Record<string, string> = {
  pdf: 'bg-danger/10 text-danger',
  dwg: 'bg-primary/10 text-primary',
  image: 'bg-purple/10 text-purple',
  other: 'bg-gray-100 text-gray-600',
}

export default function DocumentsPage() {
  const { user } = useAuthStore()
  const { addToast } = useToastStore()
  const [rows, setRows] = useState<DocRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const mine: ProjectRequest[] = await requestsApi.listMine()
      const flat: DocRow[] = []
      mine.forEach((r) =>
        r.documents.forEach((d) => flat.push({ doc: d, requestId: r.id, requestTitle: r.title }))
      )
      setRows(flat)
    } catch {
      addToast('Failed to load documents.', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userType="customer" />
      <div className="lg:ml-[246px]">
        <DashboardHeader />
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
            <p className="text-gray-500 mt-1">All files you&apos;ve shared across your requests.</p>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="animate-spin" size={18} /> Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="bg-surface rounded-xl shadow-card p-12 text-center">
              <FolderOpen className="mx-auto text-gray-300" size={42} />
              <p className="mt-4 text-gray-500">You haven&apos;t uploaded any documents yet.</p>
              <Link
                href="/requests"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
              >
                Go to Requests
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Uploaded Documents</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/80">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">File</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Request</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Uploaded</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((row) => (
                      <tr key={row.doc.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              <Paperclip size={16} />
                            </div>
                            <span className="font-medium text-gray-900 truncate max-w-[220px]">
                              {row.doc.original_filename}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <Link href={`/requests/${row.requestId}`} className="hover:text-primary transition-colors">
                            {row.requestTitle}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium uppercase ${typeBadge[row.doc.document_type] || typeBadge.other}`}>
                            {row.doc.document_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(row.doc.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <a
                            href={row.doc.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Download size={15} />
                            Download
                          </a>
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
