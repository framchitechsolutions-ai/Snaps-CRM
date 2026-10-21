import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import apiClient from './apiClient'

interface User {
  id: number
  email: string
  user_type: string
  first_name: string
  last_name: string
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      login: async (email, password) => {
        const response = await apiClient.post('/auth/login/', { email, password })
        const { access, refresh } = response.data
        localStorage.setItem('access_token', access)
        localStorage.setItem('refresh_token', refresh)
        set({
          user: response.data.user,
          token: access,
          refreshToken: refresh,
          isAuthenticated: true,
        })
      },
      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
      },
    }),
    { name: 'auth-storage' }
  )
)