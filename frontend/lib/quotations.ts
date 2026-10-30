import { create } from 'zustand'
import apiClient from './apiClient'

export interface QuotationItem {
  id?: number
  product: number
  product_name?: string
  product_sku?: string
  quantity: number
  unit_price: string
  line_total?: string
}

export interface Quotation {
  id: number
  reference: string
  client: number
  client_email: string
  client_name: string
  status: string
  notes: string
  subtotal: string
  items: QuotationItem[]
  created_at: string
  updated_at: string
}

export type QuotationPayload = {
  client: number
  status: string
  notes: string
  items: { product: number; quantity: number; unit_price: string }[]
}

interface QuotationState {
  items: Quotation[]
  count: number
  page: number
  pageSize: number
  loading: boolean
  error: string | null
  load: (page?: number, pageSize?: number, search?: string) => Promise<void>
  create: (payload: QuotationPayload) => Promise<Quotation>
  update: (id: number, payload: QuotationPayload) => Promise<Quotation>
  remove: (id: number) => Promise<void>
  setPage: (page: number) => void
}

export const useQuotationStore = create<QuotationState>((set, get) => ({
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
      const { data } = await apiClient.get('/quotations/', {
        params: { page: p, page_size: size, search: search || undefined },
      })
      const results: Quotation[] = Array.isArray(data) ? data : (data.results ?? [])
      const count: number = Array.isArray(data) ? data.length : (data.count ?? results.length)
      set({ items: results, count, loading: false })
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Failed to load quotations.'
      set({ loading: false, error: msg })
    }
  },

  create: async (payload) => {
    const { data } = await apiClient.post<Quotation>('/quotations/', payload)
    await get().load(1)
    return data
  },

  update: async (id, payload) => {
    const { data } = await apiClient.patch<Quotation>(`/quotations/${id}/`, payload)
    set({ items: get().items.map((it) => (it.id === id ? data : it)) })
    return data
  },

  remove: async (id) => {
    await apiClient.delete(`/quotations/${id}/`)
    const { items, page } = get()
    const nextPage = items.length === 1 && page > 1 ? page - 1 : page
    await get().load(nextPage)
  },

  setPage: (page) => {
    set({ page })
    get().load(page)
  },
}))
