import { create } from 'zustand'
import apiClient from './apiClient'

export interface Product {
  id: number
  name: string
  sku: string
  category: string
  price: string
  stock: number
  description: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export type ProductPayload = {
  name: string
  sku: string
  category: string
  price: string
  stock: number
  description: string
}

interface ProductState {
  items: Product[]
  count: number
  page: number
  pageSize: number
  loading: boolean
  error: string | null
  load: (page?: number, pageSize?: number, search?: string) => Promise<void>
  create: (payload: ProductPayload) => Promise<Product>
  update: (id: number, payload: Partial<ProductPayload>) => Promise<Product>
  remove: (id: number) => Promise<void>
  setPage: (page: number) => void
}

export const useProductStore = create<ProductState>((set, get) => ({
  items: [],
  count: 0,
  page: 1,
  pageSize: 10,
  loading: false,
  error: null,

  load: async (page, pageSize, search) => {
    const p = page ?? get().page
    const size = pageSize ?? get().pageSize
    set({ loading: true, error: null, page: p, pageSize: size })
    try {
      const { data } = await apiClient.get('/products/', {
        params: { page: p, page_size: size, search: search || undefined },
      })
      const results: Product[] = Array.isArray(data) ? data : (data.results ?? [])
      const count: number = Array.isArray(data) ? data.length : (data.count ?? results.length)
      set({ items: results, count, loading: false })
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Failed to load products.'
      set({ loading: false, error: msg })
    }
  },

  create: async (payload) => {
    const { data } = await apiClient.post<Product>('/products/', payload)
    await get().load(1)
    return data
  },

  update: async (id, payload) => {
    const { data } = await apiClient.patch<Product>(`/products/${id}/`, payload)
    set({ items: get().items.map((it) => (it.id === id ? data : it)) })
    return data
  },

  remove: async (id) => {
    await apiClient.delete(`/products/${id}/`)
    const { items, page } = get()
    const nextPage = items.length === 1 && page > 1 ? page - 1 : page
    await get().load(nextPage)
  },

  setPage: (page) => {
    set({ page })
    get().load(page)
  },
}))