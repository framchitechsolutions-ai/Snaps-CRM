import apiClient from './apiClient'
import type { ProjectRequest } from './requests'

export interface ProviderSummary {
  id: number
  user: { id: number; email: string; first_name: string; last_name: string }
  company_name: string
  verification_status: string
}

export interface AdminTransaction {
  id: number
  amount: string
  currency: string
  payment_method: string
  status: string
  gateway: string
  external_reference: string
  created_at: string
  customer_email: string
  request: { id: number; title: string; status: string; customer_name: string } | null
}

export const adminApi = {
  listRequests: () =>
    apiClient.get<ProjectRequest[]>('/requests/admin/').then((r) => r.data),
  assignProvider: (requestId: number, assignedProviderId: number, status: string) =>
    apiClient
      .patch<ProjectRequest>(`/requests/${requestId}/`, {
        assigned_provider: assignedProviderId,
        status,
      })
      .then((r) => r.data),
  listProviders: () =>
    apiClient.get<ProviderSummary[]>('/auth/providers/').then((r) => r.data),
  listTransactions: () =>
    apiClient.get<AdminTransaction[]>('/payments/admin/transactions/').then((r) => r.data),
  transactionAction: (id: number, action: 'approve' | 'reject') =>
    apiClient
      .post<AdminTransaction>(`/payments/admin/transactions/${id}/action/`, { action })
      .then((r) => r.data),
}
