import apiClient from './apiClient'

export type UserTypeValue = 'customer' | 'provider' | 'admin'

export interface AdminUser {
  id: number
  email: string
  first_name: string
  last_name: string
  user_type: UserTypeValue
  is_staff: boolean
  is_active: boolean
  date_joined: string
  verification_status: string | null
}

export interface CreateUserPayload {
  email: string
  password: string
  user_type: UserTypeValue
  first_name?: string
  last_name?: string
  phone_number?: string
  company_name?: string
}

export const usersApi = {
  list: () => apiClient.get<AdminUser[]>('/auth/users/').then((r) => r.data),
  create: (payload: CreateUserPayload) =>
    apiClient.post<AdminUser>('/auth/users/create/', payload).then((r) => r.data),
}
