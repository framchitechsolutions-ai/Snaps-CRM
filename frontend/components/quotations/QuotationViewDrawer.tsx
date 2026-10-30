'use client'

import React, { useEffect } from 'react'
import { X, User, Hash, Calendar, DollarSign } from 'lucide-react'
import { Quotation } from '../../lib/quotations'

interface Props {
  quotation: Quotation | null
  onClose: () => void
}

const currency = (n: string | number) =>
  new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }).format(Number(n) || 0)

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-primary/10 text-primary',
  accepted: 'bg-success/10 text-success',
  rejected: 'bg-danger/10 text-danger',
}

export default function QuotationViewDrawer({ quotation, onClose }: Props) {
  useEffect(() => {
    if (!quotation) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [quotation, onClose])

  const open = !!quotation

  const rows = quotation
    ? [
        { icon: Hash, label: 'Reference', value: quotation.reference },
        {
          icon: User,
          label: 'Client',
          value: quotation.client_name || quotation.client_email,
        },
        {
          icon: Calendar,
          label: 'Created',
          value: new Date(quotation.created_at).toLocaleString(),
        },
      ]
    : []

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[60] bg-black/30 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-[70] flex h-screen w-full max-w-[480px] flex-col bg-white shadow-elevated transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Quotation Details</h2>
            <p className="text-xs text-gray-600">Read-only view</p>
          </div>
          <button
            onClick={onClose}
            title="Close"
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {quotation && (
          <div className="flex-1 overflow-y-auto p-5">
            <div className="mb-4 flex items-center justify-between">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${
                  STATUS_BADGE[quotation.status] || 'bg-gray-100 text-gray-600'
                }`}
              >
                {quotation.status}
              </span>
              <span className="text-sm font-bold text-gray-800">
                {currency(quotation.subtotal)}
              </span>
            </div>

            <dl className="grid grid-cols-1 gap-4 mb-6">
              {rows.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-lg bg-gray-100 text-gray-600">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {label}
                    </dt>
                    <dd className="text-sm font-medium text-gray-800 break-words">
                      {value || '—'}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
                Items
              </p>
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Unit</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotation.items.map((it) => (
                      <tr key={it.id ?? it.product} className="border-b border-gray-100 last:border-0">
                        <td className="px-3 py-2">
                          <p className="font-medium text-gray-800">{it.product_name}</p>
                          <p className="text-xs text-gray-500">{it.product_sku}</p>
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700">{it.quantity}</td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          {currency(it.unit_price)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-gray-800">
                          {currency(
                            it.line_total ??
                              String(Number(it.unit_price) * it.quantity),
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td
                        colSpan={3}
                        className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-600"
                      >
                        Subtotal
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-gray-800">
                        {currency(quotation.subtotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {quotation.notes && (
              <div className="mt-5">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Notes
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{quotation.notes}</p>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  )
}
