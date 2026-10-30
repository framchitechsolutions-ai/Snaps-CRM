'use client'

import React, { useEffect } from 'react'
import { X, Package, Hash, Tag, DollarSign, Boxes } from 'lucide-react'
import { Product } from '../../lib/products'

interface Props {
  product: Product | null
  onClose: () => void
}

const currency = (n: string | number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n) || 0)

export default function ProductViewDrawer({ product, onClose }: Props) {
  useEffect(() => {
    if (!product) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [product, onClose])

  const open = !!product
  const rows = product
    ? [
        { icon: Package, label: 'Name', value: product.name },
        { icon: Hash, label: 'SKU', value: product.sku },
        { icon: Tag, label: 'Category', value: product.category || '—' },
        { icon: DollarSign, label: 'Price', value: currency(product.price) },
        { icon: Boxes, label: 'Stock', value: String(product.stock) },
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
        className={`fixed right-0 top-0 z-[70] flex h-screen w-full max-w-[400px] flex-col bg-white shadow-elevated transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Product Details</h2>
            <p className="text-xs text-gray-600">Read-only view</p>
          </div>
          <button
            onClick={onClose} title="Close"
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {product && (
          <div className="flex-1 overflow-y-auto p-5">
            <dl className="grid grid-cols-1 gap-5">
              {rows.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-lg bg-gray-100 text-gray-600">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {label}
                    </dt>
                    <dd className="text-sm font-medium text-gray-800 break-words">{value || '—'}</dd>
                  </div>
                </div>
              ))}
              {product.description && (
                <div>
                  <dt className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Description
                  </dt>
                  <dd className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                    {product.description}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </aside>
    </>
  )
}