'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, Eye, Pencil, Trash2, Package, ChevronLeft, ChevronRight,
} from 'lucide-react'
import Sidebar from '../../components/layout/Sidebar'
import DashboardHeader from '../../components/layout/DashboardHeader'
import { useAuthStore } from '../../lib/store'
import { useProductStore, Product } from '../../lib/products'
import { useToastStore } from '../../lib/toast'
import ProductFormModal from '../../components/products/ProductFormModal'
import ProductViewDrawer from '../../components/products/ProductViewDrawer'

const currency = (n: string | number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n) || 0)

export default function ProductsPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { addToast } = useToastStore()
  const { items, loading, error, page, pageSize, count, load, remove, setPage } = useProductStore()

  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [viewing, setViewing] = useState<Product | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !isAuthenticated) router.replace('/auth/login')
  }, [mounted, isAuthenticated, router])

  useEffect(() => {
    if (mounted && isAuthenticated) load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isAuthenticated])

  useEffect(() => {
    if (!mounted) return
    const t = setTimeout(() => load(1, pageSize, search), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  if (!mounted || !isAuthenticated) return <div className="min-h-screen bg-background" />

  const totalPages = Math.max(1, Math.ceil(count / pageSize))
  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (p: Product) => { setEditing(p); setFormOpen(true) }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await remove(confirmDelete.id)
      addToast('Product deleted.', 'success')
      setConfirmDelete(null)
    } catch {
      addToast('Failed to delete product.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-[246px]">
        <DashboardHeader />
        <main className="p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Products</h2>
              <p className="text-sm text-gray-600">Manage your product catalog.</p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-card transition-colors hover:bg-primary-dark"
            >
              <Plus size={16} />
              New Product
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-card border border-gray-100">
            <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">SKU</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3 text-right">Price</th>
                    <th className="px-5 py-3 text-right">Stock</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-gray-600">Loading…</td>
                    </tr>
                  ) : error && items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-gray-600">
                        Couldn&apos;t load products.
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-gray-600">
                        <div className="flex flex-col items-center gap-2">
                          <Package size={28} className="text-gray-400" />
                          <span>No products yet.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((p) => (
                      <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-800">{p.name}</p>
                          {p.description && (
                            <p className="text-xs text-gray-500 line-clamp-1">{p.description}</p>
                          )}
                        </td>
                        <td className="px-5 py-3 text-gray-600">{p.sku}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                            {p.category || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-medium text-gray-800">
                          {currency(p.price)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className={`font-medium ${
                            p.stock <= 0 ? 'text-danger'
                              : p.stock < 10 ? 'text-warning'
                              : 'text-gray-800'
                          }`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewing(p)} title="View"
                              className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => openEdit(p)} title="Edit"
                              className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(p)} title="Delete"
                              className="rounded-lg p-2 text-danger transition-colors hover:bg-danger/10"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-200 px-5 py-3">
              <p className="text-xs text-gray-600">
                Showing{' '}
                <span className="font-medium text-gray-800">
                  {count === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, count)}
                </span>{' '}
                of <span className="font-medium text-gray-800">{count}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)} disabled={page <= 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <span className="text-sm text-gray-600">
                  Page <span className="font-medium text-gray-800">{page}</span> of {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)} disabled={page >= totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <ProductFormModal
        open={formOpen}
        product={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false)
          addToast(editing ? 'Product updated.' : 'Product created.', 'success')
        }}
      />

      <ProductViewDrawer product={viewing} onClose={() => setViewing(null)} />

      {confirmDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-elevated">
            <h3 className="text-lg font-bold text-gray-800">Delete product?</h3>
            <p className="mt-2 text-sm text-gray-600">
              This will permanently remove{' '}
              <span className="font-medium text-gray-800">{confirmDelete.name}</span>.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete} disabled={deleting}
                className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-danger/90 disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}