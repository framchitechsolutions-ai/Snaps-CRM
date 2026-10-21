'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  FolderOpen,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import Sidebar from '../../components/layout/Sidebar'
import DashboardHeader from '../../components/layout/DashboardHeader'
import { useAuthStore } from '../../lib/store'
import { useToastStore } from '../../lib/toast'
import { requestsApi, ProjectRequest, Service } from '../../lib/requests'
import { statusBadgeClass, statusLabel } from '../../lib/status'

function formatPrice(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value
  return `K${isNaN(n) ? '0' : n.toLocaleString()}`
}

export default function CustomerRequestsPage() {
  const { user } = useAuthStore()
  const { addToast } = useToastStore()
  const router = useRouter()

  const [requests, setRequests] = useState<ProjectRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      setRequests(await requestsApi.listMine())
    } catch {
      addToast('Failed to load requests.', 'error')
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Requests</h2>
              <p className="text-gray-500 mt-1">Create and track your project requests.</p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
            >
              <Plus size={18} /> New Request
            </button>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="animate-spin" size={18} /> Loading…
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-surface rounded-xl shadow-card p-12 text-center">
              <FolderOpen className="mx-auto text-gray-300" size={42} />
              <p className="mt-4 text-gray-500">You have no requests yet.</p>
              <button
                onClick={() => setModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
              >
                <Plus size={18} /> Create your first request
              </button>
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
                        <p className="text-sm text-gray-500">
                          {req.selected_services.length} service(s)
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
                      {formatPrice(
                        req.selected_services.reduce(
                          (sum, s) => sum + (parseFloat(s.price) || 0),
                          0,
                        ),
                      )}
                    </span>
                    <span className="text-gray-400">
                      {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>

      {modalOpen && (
        <CreateRequestModal
          onClose={() => setModalOpen(false)}
          onCreated={(id) => {
            setModalOpen(false)
            router.push(`/requests/${id}`)
          }}
        />
      )}
    </div>
  )
}

function CreateRequestModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (id: number) => void
}) {
  const { addToast } = useToastStore()
  const [services, setServices] = useState<Service[]>([])
  const [selected, setSelected] = useState<Record<number, string>>({})
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    requestsApi
      .listServices()
      .then((data) => {
        setServices(data)
        const init: Record<number, string> = {}
        data.forEach((s) => (init[s.id] = s.base_price))
        setSelected(init)
      })
      .catch(() => addToast('Could not load services.', 'error'))
  }, [addToast])

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = { ...prev }
      if (next[id] === undefined) next[id] = services.find((s) => s.id === id)?.base_price || ''
      else delete next[id]
      return next
    })
  }

  const valid = title.trim() && description.trim() && Object.keys(selected).length > 0

  const submit = async () => {
    if (!valid) return
    setSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        selected_services: Object.entries(selected).map(([service_id, price]) => ({
          service_id: Number(service_id),
          price,
        })),
      }
      const created = await requestsApi.create(payload)
      addToast('Request created.', 'success')
      onCreated(created.id)
    } catch {
      addToast('Failed to create request.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-surface rounded-2xl shadow-elevated w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">New Project Request</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Structural drawings review"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the scope of work…"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Services (select one or more)
            </label>
            <div className="space-y-2">
              {services.map((s) => {
                const isSel = selected[s.id] !== undefined
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      isSel ? 'border-primary bg-primary/5' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => toggle(s.id)}
                      className="w-4 h-4 accent-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500 truncate">{s.description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 text-sm">K</span>
                      <input
                        type="number"
                        step="0.01"
                        value={selected[s.id] ?? ''}
                        disabled={!isSel}
                        onChange={(e) =>
                          setSelected((p) => ({ ...p, [s.id]: e.target.value }))
                        }
                        className="w-24 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                )
              })}
              {services.length === 0 && (
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} /> Loading services…
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!valid || submitting}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
            Create Request
          </button>
        </div>
      </div>
    </div>
  )
}
