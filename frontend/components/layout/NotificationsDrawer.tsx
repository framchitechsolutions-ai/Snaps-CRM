'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, MessageSquare, UserCog, Bell, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { notificationHref, useNotificationStore } from '../../lib/notifications'
import type { AppNotification } from '../../lib/notifications'

type Tab = 'all' | 'message' | 'account'

interface NotificationsDrawerProps {
  open: boolean
  onClose: () => void
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'message', label: 'Messages' },
  { key: 'account', label: 'Account' },
]

function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true })
  } catch {
    return ''
  }
}

export default function NotificationsDrawer({ open, onClose }: NotificationsDrawerProps) {
  const router = useRouter()
  const { items, loading, error, markRead, markAllRead } = useNotificationStore()
  const [tab, setTab] = useState<Tab>('all')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const shown = items.filter((n) => tab === 'all' || n.kind === tab)
  const unread = items.filter((n) => !n.isRead).length

  const openItem = (n: AppNotification) => {
    markRead(n.id)
    const href = notificationHref(n)
    onClose()
    if (href) router.push(href)
  }

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
            <h2 className="text-lg font-bold text-gray-800">Notifications</h2>
            <p className="text-xs text-gray-600">{unread > 0 ? `${unread} unread` : 'All caught up'}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={markAllRead}
              disabled={unread === 0}
              title="Mark all as read"
              className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <CheckCheck size={18} />
            </button>
            <button
              onClick={onClose}
              title="Close"
              className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 border-b border-gray-200 px-5 py-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && items.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-600">Loading…</p>
          ) : error && items.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-600">Couldn&apos;t load notifications.</p>
          ) : shown.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-600">No notifications here.</p>
          ) : (
            <ul>
              {shown.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => openItem(n)}
                    className={`flex w-full gap-3 border-b border-gray-100 px-5 py-4 text-left transition-colors hover:bg-gray-50 ${
                      n.isRead ? '' : 'bg-primary/5'
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        n.kind === 'message'
                          ? 'bg-primary/10 text-primary'
                          : n.kind === 'account'
                          ? 'bg-purple/10 text-purple'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {n.kind === 'message' ? (
                        <MessageSquare size={18} />
                      ) : n.kind === 'account' ? (
                        <UserCog size={18} />
                      ) : (
                        <Bell size={18} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800">{n.title}</p>
                      {n.body && <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">{n.body}</p>}
                      <p className="mt-1 text-xs text-gray-500">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  )
}
