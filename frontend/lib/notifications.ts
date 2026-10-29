import { create } from 'zustand'
import apiClient from './apiClient'

export type NotificationKind = 'message' | 'account' | 'other'

export interface AppNotification {
  id: number
  kind: NotificationKind
  title: string
  body: string
  isRead: boolean
  createdAt: string
}

// ASSUMPTION: the backend notifications app exposes GET /notifications/ and
// PATCH /notifications/<id>/ with { is_read: true }. If your endpoint names
// differ, change them here and nowhere else.
const LIST_URL = '/notifications/'
const itemUrl = (id: number) => `/notifications/${id}/`

function kindOf(raw: unknown): NotificationKind {
  const t = String(raw || '').toLowerCase()
  if (t.includes('message') || t.includes('chat')) return 'message'
  if (
    t.includes('account') ||
    t.includes('profile') ||
    t.includes('password') ||
    t.includes('security') ||
    t.includes('user')
  ) {
    return 'account'
  }
  return 'other'
}

function normalize(raw: any): AppNotification {
  return {
    id: raw.id,
    kind: kindOf(raw.notification_type ?? raw.type ?? raw.category),
    title: raw.title ?? raw.subject ?? 'Notification',
    body: raw.message ?? raw.body ?? raw.content ?? '',
    isRead: Boolean(raw.is_read ?? raw.read ?? false),
    createdAt: raw.created_at ?? raw.timestamp ?? new Date().toISOString(),
  }
}

// Where a notification takes you when you click it.
export function notificationHref(n: AppNotification): string | null {
  if (n.kind === 'message') return '/messaging'
  if (n.kind === 'account') return '/profile'
  return null
}

interface NotificationState {
  items: AppNotification[]
  loading: boolean
  error: boolean
  load: () => Promise<void>
  markRead: (id: number) => void
  markAllRead: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  loading: false,
  error: false,
  load: async () => {
    set({ loading: true })
    try {
      const res = await apiClient.get(LIST_URL)
      const list = Array.isArray(res.data) ? res.data : res.data?.results ?? []
      const items: AppNotification[] = list.map(normalize)
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      set({ items, error: false })
    } catch {
      set({ error: true })
    } finally {
      set({ loading: false })
    }
  },
  markRead: (id) => {
    set((s) => ({ items: s.items.map((n) => (n.id === id ? { ...n, isRead: true } : n)) }))
    apiClient.patch(itemUrl(id), { is_read: true }).catch(() => {})
  },
  markAllRead: () => {
    const unread = get().items.filter((n) => !n.isRead)
    set((s) => ({ items: s.items.map((n) => ({ ...n, isRead: true })) }))
    unread.forEach((n) => apiClient.patch(itemUrl(n.id), { is_read: true }).catch(() => {}))
  },
}))
