'use client'

import React, { useEffect, useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { useQuotationStore, Quotation, QuotationPayload } from '../../lib/quotations'
import { useProductStore } from '../../lib/products'
import apiClient from '../../lib/apiClient'
import { useToastStore } from '../../lib/toast'

interface Props {
  open: boolean
  quotation: Quotation | null
  onClose: () => void
  onSaved: () => void
}

interface ClientOption {
  id: number
  email: string
  first_name?: string
  last_name?: string
}

interface LineItem {
  product: number | ''
  quantity: number
  unit_price: string
}

const EMPTY_LINE: LineItem = { product: '', quantity: 1, unit_price: '0.00' }

const STATUSES = ['draft', 'sent', 'accepted', 'rejected']

export default function QuotationFormModal({ open, quotation, onClose, onSaved }: Props) {
  const { create, update } = useQuotationStore()
  const { items: products, load: loadProducts } = useProductStore()
  const { addToast } = useToastStore()

  const [client, setClient] = useState<number | ''>('')
  const [status, setStatus] = useState('draft')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<LineItem[]>([{ ...EMPTY_LINE }])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [saving, setSaving] = useState(false)

  // Load products (via store) and clients (direct) once when the modal opens.
  useEffect(() => {
    if (!open) return
    loadProducts(1, 100)
    apiClient
      .get('/auth/users/', { params: { page_size: 200 } })
      .then(({ data }) => {
        const list: ClientOption[] = Array.isArray(data) ? data : (data.results ?? [])
        setClients(list)
      })
      .catch(() => addToast('Could not load clients.', 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Seed the form from the quotation being edited.
  useEffect(() => {
    if (!open) return
    if (quotation) {
      setClient(quotation.client)
      setStatus(quotation.status)
      setNotes(quotation.notes || '')
      setLines(
        quotation.items.length
          ? quotation.items.map((it) => ({
              product: it.product,
              quantity: it.quantity,
              unit_price: String(it.unit_price),
            }))
          : [{ ...EMPTY_LINE }],
      )
    } else {
      setClient('')
      setStatus('draft')
      setNotes('')
      setLines([{ ...EMPTY_LINE }])
    }
  }, [open, quotation])

  if (!open) return null

  const updateLine = (idx: number, patch: Partial<LineItem>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  }

  const onProductChange = (idx: number, productId: number) => {
    const p = products.find((x) => x.id === productId)
    updateLine(idx, {
      product: productId,
      unit_price: p ? String(p.price) : '0.00',
    })
  }

  const addLine = () => setLines((prev) => [...prev, { ...EMPTY_LINE }])
  const removeLine = (idx: number) =>
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)))

  const subtotal = lines.reduce(
    (sum, l) => sum + Number(l.unit_price || 0) * Number(l.quantity || 0),
    0,
  )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!client) {
      addToast('Please select a client.', 'error')
      return
    }
    const validLines = lines.filter((l) => l.product !== '' && l.quantity > 0)
    if (validLines.length === 0) {
      addToast('Add at least one product line.', 'error')
      return
    }
    const payload: QuotationPayload = {
      client: Number(client),
      status,
      notes,
      items: validLines.map((l) => ({
        product: Number(l.product),
        quantity: Number(l.quantity),
        unit_price: String(l.unit_price),
      })),
    }
    setSaving(true)
    try {
      if (quotation) await update(quotation.id, payload)
      else await create(payload)
      onSaved()
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: Record<string, string | string[]> } })?.response?.data
      const first =
        detail && typeof detail === 'object' ? Object.values(detail).flat()[0] : null
      addToast(typeof first === 'string' ? first : 'Failed to save quotation.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const field =
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all'
  const label = 'mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-600'

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-elevated">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
          <h3 className="text-lg font-bold text-gray-800">
            {quotation ? `Edit ${quotation.reference}` : 'New Quotation'}
          </h3>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 px-5 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Client</label>
              <select
                className={field}
                value={client}
                onChange={(e) => setClient(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">— Select a client —</option>
                {clients.map((c) => {
                  const name = `${c.first_name || ''} ${c.last_name || ''}`.trim()
                  return (
                    <option key={c.id} value={c.id}>
                      {name ? `${name} (${c.email})` : c.email}
                    </option>
                  )
                })}
              </select>
            </div>
            <div>
              <label className={label}>Status</label>
              <select className={field} value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={label + ' !mb-0'}>Products</label>
              <button
                type="button"
                onClick={addLine}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Plus size={14} /> Add line
              </button>
            </div>

            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2 w-24 text-right">Qty</th>
                    <th className="px-3 py-2 w-32 text-right">Unit price</th>
                    <th className="px-3 py-2 w-28 text-right">Line total</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, idx) => {
                    const lineTotal = Number(line.unit_price || 0) * Number(line.quantity || 0)
                    return (
                      <tr key={idx} className="border-b border-gray-100 last:border-0">
                        <td className="px-3 py-2">
                          <select
                            className={field}
                            value={line.product}
                            onChange={(e) => onProductChange(idx, Number(e.target.value))}
                          >
                            <option value="">— Select product —</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={1}
                            className={field + ' text-right'}
                            value={line.quantity}
                            onChange={(e) =>
                              updateLine(idx, { quantity: Number(e.target.value) })
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            className={field + ' text-right'}
                            value={line.unit_price}
                            onChange={(e) =>
                              updateLine(idx, { unit_price: e.target.value })
                            }
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-gray-800">
                          ${lineTotal.toFixed(2)}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            disabled={lines.length === 1}
                            className="rounded-lg p-1.5 text-danger transition-colors hover:bg-danger/10 disabled:opacity-30"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t border-gray-200">
                    <td colSpan={3} className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Subtotal
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-gray-800">
                      ${subtotal.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div>
            <label className={label}>Notes</label>
            <textarea
              rows={3}
              className={field}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {saving ? 'Saving…' : quotation ? 'Save changes' : 'Create quotation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}