'use client'

import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useProductStore, Product, ProductPayload } from '../../lib/products'
import { useToastStore } from '../../lib/toast'

interface Props {
  open: boolean
  product: Product | null
  onClose: () => void
  onSaved: () => void
}

const EMPTY: ProductPayload = {
  name: '', sku: '', category: '', price: '0.00', stock: 0, description: '',
}

export default function ProductFormModal({ open, product, onClose, onSaved }: Props) {
  const { create, update } = useProductStore()
  const { addToast } = useToastStore()
  const [form, setForm] = useState<ProductPayload>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(
      product
        ? {
            name: product.name,
            sku: product.sku,
            category: product.category,
            price: String(product.price),
            stock: product.stock,
            description: product.description,
          }
        : EMPTY,
    )
  }, [open, product])

  if (!open) return null

  const set = <K extends keyof ProductPayload>(key: K, value: ProductPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.sku.trim()) {
      addToast('Name and SKU are required.', 'error')
      return
    }
    setSaving(true)
    try {
      if (product) await update(product.id, form)
      else await create(form)
      onSaved()
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: Record<string, string | string[]> } })?.response?.data
      const first =
        detail && typeof detail === 'object' ? Object.values(detail).flat()[0] : null
      addToast(typeof first === 'string' ? first : 'Failed to save product.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const field =
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all'
  const label = 'mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-600'

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-elevated">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-lg font-bold text-gray-800">
            {product ? 'Edit Product' : 'New Product'}
          </h3>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-5">
          <div>
            <label className={label}>Name</label>
            <input className={field} value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>SKU</label>
              <input className={field} value={form.sku} onChange={(e) => set('sku', e.target.value)} />
            </div>
            <div>
              <label className={label}>Category</label>
              <input className={field} value={form.category} onChange={(e) => set('category', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Price</label>
              <input
                type="number" min={0} step="0.01" className={field}
                value={form.price} onChange={(e) => set('price', e.target.value)}
              />
            </div>
            <div>
              <label className={label}>Stock</label>
              <input
                type="number" min={0} className={field}
                value={form.stock} onChange={(e) => set('stock', Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <label className={label}>Description</label>
            <textarea
              rows={3} className={field}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button" onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {saving ? 'Saving…' : product ? 'Save changes' : 'Create product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}