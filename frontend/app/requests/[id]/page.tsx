'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  Send,
  Ban,
  Loader2,
  Paperclip,
  User as UserIcon,
} from 'lucide-react'
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

export default function RequestDetailPage() {
  const params = useParams()
  const id = Number(params?.id)
  const { user } = useAuthStore()
  const { addToast } = useToastStore()

  const [req, setReq] = useState<ProjectRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setReq(await requestsApi.get(id))
    } catch {
      addToast('Failed to load request.', 'error')
    } finally {
      setLoading(false)
    }
  }, [id, addToast])

  useEffect(() => {
    load()
  }, [load])

  const role = user?.user_type
  const isCustomer = role === 'customer'
  const isProvider = role === 'provider'
  const isOwner = req?.customer?.id === user?.id
  const isAssigned = req?.assigned_provider?.id === user?.id

  const changeStatus = async (status: string) => {
    setBusy(true)
    try {
      setReq(await requestsApi.updateStatus(id, status))
      addToast(`Status updated to ${statusLabel(status)}.`, 'success')
    } catch {
      addToast('Could not update status.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const uploadDocument = async (file: File, document_type: string) => {
    setBusy(true)
    try {
      await requestsApi.uploadDocument(id, file, document_type)
      addToast('Document uploaded.', 'success')
      await load()
    } catch {
      addToast('Document upload failed.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const submitDeliverable = async (selected_service_id: number, file: File) => {
    setBusy(true)
    try {
      await requestsApi.submitDeliverable(id, selected_service_id, file)
      addToast('Deliverable submitted.', 'success')
      await load()
    } catch {
      addToast('Deliverable upload failed.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const reviewDeliverable = async (deliverable_id: number, action: 'accept' | 'reject') => {
    setBusy(true)
    try {
      setReq(await requestsApi.reviewDeliverable(id, deliverable_id, action))
      addToast(action === 'accept' ? 'Deliverable accepted.' : 'Deliverable rejected.', 'success')
    } catch {
      addToast('Review failed.', 'error')
    } finally {
      setBusy(false)
    }
  }

  const openDeliverable = async (deliverable_id: number) => {
    try {
      const { download_url } = await requestsApi.getDeliverableDownloadUrl(id, deliverable_id)
      window.open(download_url, '_blank', 'noopener,noreferrer')
    } catch {
      addToast('Could not generate download link.', 'error')
    }
  }

  const proceedToPayment = async () => {
    setBusy(true)
    try {
      const payment = await requestsApi.initiatePayment(id)
      if (payment.checkout_url.startsWith('/mock-checkout/')) {
        // Dummy gateway (local dev): complete the flow via the simulate endpoint.
        await requestsApi.simulatePayment(payment.reference)
        addToast('Payment successful.', 'success')
        await load()
      } else {
        // Real PSP: hand off to the hosted checkout.
        window.open(payment.checkout_url, '_blank', 'noopener,noreferrer')
      }
    } catch {
      addToast('Could not start payment.', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-gray-500">
        <Loader2 className="animate-spin" /> Loading…
      </div>
    )
  }

  if (!req) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Request not found.</p>
          <Link href="/requests" className="text-primary hover:underline">
            Back to requests
          </Link>
        </div>
      </div>
    )
  }

  const canCustomerAct = isCustomer && isOwner
  const canProviderAct = isProvider && isAssigned

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userType={role} />
      <div className="lg:ml-[246px]">
        <DashboardHeader />
        <main className="p-6 lg:p-8 max-w-5xl mx-auto">
          <Link
            href={isProvider ? '/requests/provider' : '/requests'}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={16} /> Back
          </Link>

          {/* Header */}
          <div className="bg-surface rounded-xl shadow-card p-6 border border-gray-100">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">{req.title}</h2>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClass(
                      req.status,
                    )}`}
                  >
                    {statusLabel(req.status)}
                  </span>
                </div>
                <p className="mt-2 text-gray-600 max-w-2xl">{req.description}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <Meta label="Customer" value={`${req.customer.first_name} ${req.customer.last_name}`} />
              <Meta
                label="Provider"
                value={req.assigned_provider ? `${req.assigned_provider.first_name} ${req.assigned_provider.last_name}` : 'Unassigned'}
              />
              <Meta label="Created" value={new Date(req.created_at).toLocaleDateString()} />
              <Meta label="Total" value={formatPrice(req.selected_services.reduce((s, x) => s + (parseFloat(x.price) || 0), 0))} />
            </div>

            {/* Customer workflow actions */}
            {canCustomerAct && req.status === 'draft' && (
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => changeStatus('submitted')}
                  disabled={busy}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark disabled:opacity-50"
                >
                  <Send size={16} /> Submit Request
                </button>
                <button
                  onClick={() => changeStatus('cancelled')}
                  disabled={busy}
                  className="flex items-center gap-2 px-4 py-2.5 bg-danger/10 text-danger rounded-xl font-medium hover:bg-danger/20 disabled:opacity-50"
                >
                  <Ban size={16} /> Cancel
                </button>
              </div>
            )}

            {canCustomerAct && req.status === 'awaiting_payment' && (
              <div className="mt-5">
                <button
                  onClick={proceedToPayment}
                  disabled={busy}
                  className="flex items-center gap-2 px-4 py-2.5 bg-purple text-white rounded-xl font-medium hover:bg-purple/90 disabled:opacity-50"
                >
                  {busy ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} Proceed to Payment
                </button>
              </div>
            )}

            {/* Provider workflow actions */}
            {canProviderAct && (
              <div className="mt-5 flex gap-3 flex-wrap">
                {req.status !== 'in_review' && (
                  <button
                    onClick={() => changeStatus('in_review')}
                    disabled={busy}
                    className="px-4 py-2.5 bg-warning/10 text-warning rounded-xl font-medium hover:bg-warning/20 disabled:opacity-50"
                  >
                    Mark In Review
                  </button>
                )}
                {req.status !== 'in_progress' && (
                  <button
                    onClick={() => changeStatus('in_progress')}
                    disabled={busy}
                    className="px-4 py-2.5 bg-primary/10 text-primary rounded-xl font-medium hover:bg-primary/20 disabled:opacity-50"
                  >
                    Start Progress
                  </button>
                )}
                {req.status !== 'completed' && (
                  <button
                    onClick={() => changeStatus('completed')}
                    disabled={busy}
                    className="px-4 py-2.5 bg-success/10 text-success rounded-xl font-medium hover:bg-success/20 disabled:opacity-50"
                  >
                    Mark Completed
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Services */}
          <Section title="Selected Services">
            <div className="space-y-3">
              {req.selected_services.map((ss) => (
                <div
                  key={ss.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{ss.service.name}</p>
                    <p className="text-xs text-gray-500">{ss.service.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">{formatPrice(ss.price)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadgeClass(ss.status)}`}>
                      {statusLabel(ss.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Documents */}
          <Section title="Documents">
            <DocumentUploader onUpload={uploadDocument} disabled={busy} />
            <div className="mt-3 space-y-2">
              {req.documents.length === 0 && (
                <p className="text-sm text-gray-500">No documents uploaded yet.</p>
              )}
              {req.documents.map((d) => (
                <a
                  key={d.id}
                  href={d.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50"
                >
                  <Paperclip size={16} className="text-primary" />
                  <span className="text-sm text-gray-800 flex-1 truncate">{d.original_filename}</span>
                  <span className="text-xs text-gray-400 uppercase">{d.document_type}</span>
                </a>
              ))}
            </div>
          </Section>

          {/* Deliverables */}
          <Section title="Deliverables">
            {req.selected_services.every((ss) => ss.deliverables.length === 0) && (
              <p className="text-sm text-gray-500">No deliverables submitted yet.</p>
            )}
            {req.selected_services.map((ss) => (
              <div key={ss.id} className="mb-4 p-4 rounded-xl border border-gray-100">
                <p className="text-sm font-semibold text-gray-900 mb-2">{ss.service.name}</p>

                {/* Existing deliverables */}
                {ss.deliverables.map((del) => (
                  <div
                    key={del.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 mb-2"
                  >
                    <FileText size={16} className="text-success" />
                    <button
                      type="button"
                      onClick={() => openDeliverable(del.id)}
                      className="text-sm text-gray-800 flex-1 truncate text-left hover:underline"
                    >
                      {del.original_filename}
                    </button>
                    {canCustomerAct && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => reviewDeliverable(del.id, 'accept')}
                          disabled={busy}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-success/10 text-success rounded-lg text-xs font-medium hover:bg-success/20 disabled:opacity-50"
                        >
                          <CheckCircle2 size={14} /> Accept
                        </button>
                        <button
                          onClick={() => reviewDeliverable(del.id, 'reject')}
                          disabled={busy}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-danger/10 text-danger rounded-lg text-xs font-medium hover:bg-danger/20 disabled:opacity-50"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Provider: upload deliverable */}
                {canProviderAct && ss.status !== 'completed' && (
                  <DeliverableUploader
                    onUpload={(file) => submitDeliverable(ss.id, file)}
                    disabled={busy}
                  />
                )}
              </div>
            ))}
          </Section>
        </main>
      </div>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 font-medium text-gray-800 truncate">{value}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface rounded-xl shadow-card p-6 border border-gray-100 mt-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  )
}

function DocumentUploader({
  onUpload,
  disabled,
}: {
  onUpload: (file: File, document_type: string) => void
  disabled: boolean
}) {
  const [file, setFile] = useState<File | null>(null)
  const [type, setType] = useState('pdf')
  const inputRef = React.useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <option value="dwg">DWG</option>
        <option value="pdf">PDF</option>
        <option value="image">Image</option>
        <option value="other">Other</option>
      </select>
      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm hover:bg-gray-100"
      >
        <Upload size={16} /> Choose file
      </button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      {file && <span className="text-sm text-gray-600 truncate max-w-[200px]">{file.name}</span>}
      {file && (
        <button
          onClick={() => {
            onUpload(file, type)
            setFile(null)
            if (inputRef.current) inputRef.current.value = ''
          }}
          disabled={disabled}
          className="flex items-center gap-1 px-3 py-2 bg-primary text-white rounded-xl text-sm disabled:opacity-50"
        >
          {disabled ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />} Upload
        </button>
      )}
    </div>
  )
}

function DeliverableUploader({
  onUpload,
  disabled,
}: {
  onUpload: (file: File) => void
  disabled: boolean
}) {
  const [file, setFile] = useState<File | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-center gap-3 mt-2">
      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm hover:bg-gray-100"
      >
        <Upload size={16} /> Upload deliverable (PDF)
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      {file && <span className="text-sm text-gray-600 truncate max-w-[200px]">{file.name}</span>}
      {file && (
        <button
          onClick={() => {
            onUpload(file)
            setFile(null)
            if (inputRef.current) inputRef.current.value = ''
          }}
          disabled={disabled}
          className="flex items-center gap-1 px-3 py-2 bg-success text-white rounded-xl text-sm disabled:opacity-50"
        >
          {disabled ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />} Submit
        </button>
      )}
    </div>
  )
}
