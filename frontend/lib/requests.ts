import apiClient from './apiClient'

export interface Service {
  id: number
  name: string
  code: string
  description: string
  base_price: string
}

export interface SelectedService {
  id: number
  service: Service
  price: string
  status: string
  deliverables: Deliverable[]
}

export interface AppDocument {
  id: number
  file_url: string
  document_type: string
  original_filename: string
  created_at: string
  uploaded_by?: { id: number; first_name: string; last_name: string; email: string }
}

export interface Deliverable {
  id: number
  selected_service: number
  file_url: string
  original_filename: string
  created_at: string
}

export interface AppUser {
  id: number
  email: string
  first_name: string
  last_name: string
  user_type: string
}

export interface ProjectRequest {
  id: number
  title: string
  description: string
  status: string
  created_at: string
  updated_at: string
  documents: AppDocument[]
  selected_services: SelectedService[]
  customer: AppUser
  assigned_provider: AppUser | null
}

export const requestsApi = {
  listServices: () =>
  apiClient.get('/requests/services/').then((r) => {
    const data = r.data
    return Array.isArray(data) ? data : (data?.results ?? [])
  }),
  listMine: () => apiClient.get<ProjectRequest[]>('/requests/my/').then((r) => r.data),
  listProvider: () =>
  apiClient.get('/requests/provider/').then((r) => {
    const data = r.data
    return Array.isArray(data) ? data : (data?.results ?? [])
  }),
  get: (id: number) => apiClient.get<ProjectRequest>(`/requests/${id}/`).then((r) => r.data),
  create: (payload: { title: string; description: string; selected_services: { service_id: number; price: string }[] }) =>
    apiClient.post<ProjectRequest>('/requests/', payload).then((r) => r.data),
  updateStatus: (id: number, status: string) =>
    apiClient.patch<ProjectRequest>(`/requests/${id}/`, { status }).then((r) => r.data),
  uploadDocument: (id: number, file: File, document_type: string) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('document_type', document_type)
    return apiClient.post<AppDocument>(`/requests/${id}/upload-document/`, fd).then((r) => r.data)
  },
  submitDeliverable: (id: number, selected_service_id: number, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('selected_service_id', String(selected_service_id))
    return apiClient.post<Deliverable>(`/requests/${id}/deliverable/`, fd).then((r) => r.data)
  },
  reviewDeliverable: (id: number, deliverable_id: number, action: 'accept' | 'reject') =>
    apiClient
      .post<ProjectRequest>(`/requests/${id}/review-deliverable/`, { deliverable_id, action })
      .then((r) => r.data),
  initiatePayment: (id: number) =>
    apiClient
      .post<{ transaction_id: number; amount: string; currency: string; client_secret: string; checkout_url: string; reference: string }>(
        `/requests/${id}/payment/initiate/`,
      )
      .then((r) => r.data),
  simulatePayment: (reference: string) =>
    apiClient
      .post<{ status: string }>(`/payments/simulate-success/`, { reference })
      .then((r) => r.data),
  getDeliverableDownloadUrl: (requestId: number, deliverableId: number) =>
    apiClient
      .get<{ download_url: string; expires_in: number; original_filename: string }>(
        `/requests/${requestId}/deliverables/${deliverableId}/download/`,
      )
      .then((r) => r.data),
}
